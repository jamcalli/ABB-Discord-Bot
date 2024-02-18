import { logger } from '../bot'; 
import { QBittorrent } from '@ctrl/qbittorrent';
import dotenv from "dotenv";
import { exec } from 'child_process';
//import { senddownloadEmbed, senddownloadcompleteEmbed, senddownloadinitEmbed } from './sendEmbed';



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

const userTorrents = new Map<string, string[]>();

export function addUserTorrent(userId: string, initialTorrent: any) {
  const userTorrentsArray = userTorrents.get(userId) || [];
  if (!userTorrentsArray.includes(initialTorrent.id)) {
    userTorrentsArray.push(initialTorrent.id);
    userTorrents.set(userId, userTorrentsArray);
  }
}

export async function downloadHandler(qbittorrent: QBittorrent) {
  let previousTorrents: any[] = [];
  let intervalId: NodeJS.Timeout;
  let wasQueueEmpty = true; // Add this flag

  const checkTorrents = async () => {
    const allData = await qbittorrent.getAllData();
    const torrents = allData.torrents;

    if (torrents.length === 0) {
      if (!wasQueueEmpty) { // Only log the message if the queue was not empty before
        logger.info('No torrents in the queue. Waiting for new torrents.');
      }
      wasQueueEmpty = true; // Update the flag
      return;
    }

    wasQueueEmpty = false; // Update the flag

    for (const torrent of torrents) {
      const previousTorrent = previousTorrents.find(t => t.id === torrent.id);

      if (torrent.state !== 'downloading') {
        if (!previousTorrent || previousTorrent.state === 'downloading') {
          logger.info(`AudioBook: ${torrent.name} is complete. Removing from client.`);
          const result = await qbittorrent.removeTorrent(torrent.id, false);
          logger.info(`Removal result for ${torrent.name}: ${result}`);

          // Remove the torrent from the user's array
          userTorrents.forEach((userTorrentsArray, userId) => {
            if (userTorrentsArray.includes(torrent.id)) {
              userTorrents.set(userId, userTorrentsArray.filter(id => id !== torrent.id));
              logger.info(`Removed AudioBook: ${torrent.name} from User: ${userId}.`); // Log the user ID
            }
          });

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
        }
      } else if (!previousTorrent || previousTorrent.state !== 'downloading') {
        logger.info(`Audiobook: ${torrent.name} is downloading.`);

        // Add the torrent to the user's array
        userTorrents.forEach((userTorrentsArray, userId) => {
          if (!userTorrentsArray.includes(torrent.id)) {
            userTorrentsArray.push(torrent.id);
            userTorrents.set(userId, userTorrentsArray);
            logger.info(`Added AudioBook: ${torrent.name} to User: ${userId}.`); // Log the user ID
          }
        });
      }
    }

    previousTorrents = torrents;
  };

  intervalId = setInterval(checkTorrents, 10000); // Check every 10 seconds
}