import { logger } from '../bot'; 
import { QBittorrent } from '@ctrl/qbittorrent';
import dotenv from "dotenv";
import { exec } from 'child_process';
import { ButtonInteraction } from 'discord.js';
import { senddownloadEmbed, senddownloadcompleteDM } from './sendEmbed';

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
    //console.log(data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('torrents/add": <no response>')) {
      console.error(`Sticky magnet? - ${error.message}`);
    } else {
      throw error; // re-throw the error if it's not the one we're looking for
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

export async function downloadHandler(client: any, qbittorrent: QBittorrent) {
  // replace 'any' with the actual type of your Discord client
  let previousTorrents: any[] = [];
  let wasQueueEmpty = true;

  const checkTorrents = async () => {
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

    for (const torrent of torrents) {
      const previousTorrent = previousTorrents.find(t => t.id === torrent.id);

      if (torrent.state !== 'downloading') {
        if (!previousTorrent || previousTorrent.state === 'downloading') {
          logger.info(`AudioBook: ${torrent.name} is complete. Removing from client.`);

          // Run the curl command
          exec(`curl -s ${PLEX_HOST}library/sections/11/refresh?X-Plex-Token=${PLEX_TOKEN}`, (error, stdout, stderr) => {
            if (error) {
              logger.error(`Error refreshing Plex library: ${error.message}`);
              return;
            }
          
            if (stderr) {
              logger.error(`Error refreshing Plex library: ${stderr}`);
              return;
            }
          });

          const result = await qbittorrent.removeTorrent(torrent.id, false);
          logger.info(`Removal result for ${torrent.name}: ${result}`);

          // Remove the torrent from the user's array
          userTorrents.forEach(async (userTorrentsData, userId) => {
            if (userTorrentsData.torrents.includes(torrent.id)) {
              userTorrentsData.torrents = userTorrentsData.torrents.filter(id => id !== torrent.id);
              userTorrents.set(userId, userTorrentsData);
              logger.info(`Removed AudioBook: ${torrent.name} from User: ${userId}.`);

              // Send the download complete embed message as a DM
              await senddownloadcompleteDM(client, userId, { name: torrent.name });
            }
          });
        }
      } else if (!previousTorrent || previousTorrent.state !== 'downloading') {
        logger.info(`Audiobook: ${torrent.name} is downloading.`);

        // Add the torrent to the user's array
        userTorrents.forEach((userTorrentsData, userId) => {
          if (!userTorrentsData.torrents.includes(torrent.id)) {
            userTorrentsData.torrents.push(torrent.id);
            userTorrents.set(userId, userTorrentsData);
            logger.info(`Added AudioBook: ${torrent.name} to User: ${userId}.`);

            // Send the download embed message
            senddownloadEmbed(userTorrentsData.interaction, userId, { name: torrent.name });
          }
        });
      }
    }

    previousTorrents = torrents;
  };

  setInterval(checkTorrents, 10000); 
}