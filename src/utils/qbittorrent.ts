import { logger } from '../bot'; 
import { QBittorrent } from '@ctrl/qbittorrent';
import dotenv from "dotenv";
import { exec as execCb } from 'child_process';
import { ButtonInteraction } from 'discord.js';
import { senddownloadEmbed, senddownloadcompleteDM } from './sendEmbed';
import { promisify } from 'util';

dotenv.config();

const { QBITTORRENT_HOST, QBITTORRENT_USERNAME, QBITTORRENT_PASSWORD, PLEX_HOST, PLEX_TOKEN } = process.env;

export const qbittorrent = new QBittorrent({
  baseUrl: QBITTORRENT_HOST,
  username: QBITTORRENT_USERNAME,
  password: QBITTORRENT_PASSWORD,
});

export async function downloadMagnet(magnet: string) {
  try {
    const data = await qbittorrent.addMagnet(magnet);
  } catch (error) {
    if (error instanceof Error && error.message.includes('torrents/add": <no response>')) {
      console.error(`Sticky magnet? - ${error.message}`);
    } else {
      throw error; 
    }
  }
}

const userTorrents = new Map<string, { torrents: string[], interaction: ButtonInteraction }>();

export function addUserTorrent(userId: string, initialTorrent: any, i: ButtonInteraction) {
  let userTorrentsData = userTorrents.get(userId) || { torrents: [], interaction: i };
  if (!userTorrentsData.torrents.includes(initialTorrent.id)) {
    userTorrentsData.torrents.push(initialTorrent.id);
    userTorrents.set(userId, userTorrentsData);
  }
}

const exec = promisify(execCb);

async function runCurlCommand(): Promise<void> {
  try {
    const { stdout, stderr } = await exec(`curl -s ${PLEX_HOST}library/sections/11/refresh?X-Plex-Token=${PLEX_TOKEN}`);
    
    if (stderr) {
      logger.error(`Error refreshing Plex library: ${stderr}`);
      return;
    }
    if (stdout.trim() !== '') {
      logger.info(stdout);
    }
  } catch (error) {
    logger.error(`Error refreshing Plex library: ${(error as Error).message}`);
  }
}

async function updateUserTorrents(userId: string, userTorrentsData: any, torrent: any, isDownloading: boolean, client: any) {
  if (isDownloading) {
    if (!userTorrentsData.torrents.includes(torrent.id)) {
      userTorrentsData.torrents.push(torrent.id);
      userTorrents.set(userId, userTorrentsData);
      logger.info(`Added AudioBook: ${torrent.name} to User: ${userId}.`);

      senddownloadEmbed(userTorrentsData.interaction, userId, { name: torrent.name });
    }
  } else {
    if (userTorrentsData.torrents.includes(torrent.id)) {
      userTorrentsData.torrents = userTorrentsData.torrents.filter((id: string) => id !== torrent.id);
      userTorrents.set(userId, userTorrentsData);
      logger.info(`Removed AudioBook: ${torrent.name} from User: ${userId}.`);

      await senddownloadcompleteDM(client, userId, { name: torrent.name });
    }
  }
}

export async function downloadHandler(client: any, qbittorrent: QBittorrent) {
  let previousTorrents: any[] = [];
  let wasQueueEmpty = true;

  const checkTorrents = async () => {
    try {
      const allData = await qbittorrent.getAllData();
      const torrents = allData.torrents;

      if (torrents.length === 0) {
        if (!wasQueueEmpty) {
          logger.info('No torrents in the queue. Waiting for new torrents.');
        }
        wasQueueEmpty = true;
        return;
      }

      wasQueueEmpty = false;

      const promises = torrents.map(async (torrent) => {
        const previousTorrent = previousTorrents.find(t => t.id === torrent.id);

        if (torrent.state !== 'downloading') {
          if (!previousTorrent || previousTorrent.state === 'downloading') {
            logger.info(`AudioBook: ${torrent.name} is complete. Removing from client.`);

            await runCurlCommand();

            const result = await qbittorrent.removeTorrent(torrent.id, false);
            logger.info(`Removal result for ${torrent.name}: ${result}`);

            const userPromises = Array.from(userTorrents.entries()).map(async ([userId, userTorrentsData]) => {
              await updateUserTorrents(userId, userTorrentsData, torrent, false, client);
            });

            await Promise.all(userPromises);
          }
        } else if (!previousTorrent || previousTorrent.state !== 'downloading') {
          logger.info(`Audiobook: ${torrent.name} is downloading.`);

          const userPromises = Array.from(userTorrents.entries()).map(async ([userId, userTorrentsData]) => {
            await updateUserTorrents(userId, userTorrentsData, torrent, true, client);
          });

          await Promise.all(userPromises);
        }
      });

      await Promise.all(promises);

      previousTorrents = torrents;
    } catch (error) {
      logger.error(`Error while checking torrents: ${error}`);
    }
  };

  setInterval(checkTorrents, 10000); 
}