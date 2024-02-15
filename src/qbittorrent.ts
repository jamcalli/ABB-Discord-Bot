import { QBittorrent } from '@ctrl/qbittorrent';
import dotenv from "dotenv";
import { exec } from 'child_process';
import { senddownloadEmbed, senddownloadcompleteEmbed, senddownloadinitEmbed } from './utils/sendEmbed';

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

export async function checkAndRemoveCompletedTorrents(qbittorrent: QBittorrent, userId: string, interaction: any, initialTorrent: any) {

  // Notify the user immediately that the download was sent
  senddownloadinitEmbed(interaction, userId, initialTorrent);

  let previousTorrents: any[] = [];
  let intervalId: NodeJS.Timeout;

  const checkTorrents = async () => {
    const allData = await qbittorrent.getAllData();
    const torrents = allData.torrents;

    if (torrents.length === 0) {
      console.log('No torrents in the queue. Stopping.');
      clearInterval(intervalId);
      return;
    }

    for (const torrent of torrents) {
      const previousTorrent = previousTorrents.find(t => t.id === torrent.id);

      if (torrent.state !== 'downloading') {
        if (!previousTorrent || previousTorrent.state === 'downloading') {
          console.log(`Torrent ${torrent.name} is complete. Removing from client.`);
          const result = await qbittorrent.removeTorrent(torrent.id, false);
          console.log(`Removal result for ${torrent.name}: ${result}`);

          // Send a message to the user
          senddownloadcompleteEmbed(interaction, userId, torrent);

          // Run the curl command
          exec(`curl -s ${PLEX_HOST}library/sections/11/refresh?X-Plex-Token=${PLEX_TOKEN}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error refreshing Plex library: ${error.message}`);
              return;
            }
          
            if (stderr) {
              console.error(`Error refreshing Plex library: ${stderr}`);
              return;
            }
          });
        }
      } else if (!previousTorrent || previousTorrent.state !== 'downloading') {
        console.log(`Torrent ${torrent.name} is still downloading.`);

        // Send a message to the user
        senddownloadEmbed(interaction, userId, torrent);

      }
    }

    previousTorrents = torrents;
  };

  intervalId = setInterval(checkTorrents, 10000); // Check every 10 seconds
}
