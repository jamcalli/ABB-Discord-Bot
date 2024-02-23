import { getAudiobook } from "../utils/getAudiobook";
import { testSite } from "../utils/siteTest";
import { audiobookBayUrl } from "../constants";
import { sendEmbed, sendmoreinfoEmbed, disableButtons, senderrorEmbed, senddownloadinitEmbed } from "../utils/sendEmbed";
import { queueUserTorrent } from "../utils/qbittorrent";
import { logger } from '../bot';
import { InteractionCollector, ButtonInteraction } from 'discord.js';

export function bookBrowser(
    collector: InteractionCollector<ButtonInteraction>,
    searchResult: SearchResult,
  ) {
    let index = 0;
    let extendedBook: any | null = null; // replace 'any' with the actual type of extendedBook
  
    collector.on('collect', async (i: ButtonInteraction) => {
      let embedData = searchResult.data[index];
  
      try {
        logger.debug(`Processing interaction with customId: ${i.customId}`);
        await i.deferUpdate();

        if (i.customId === 'button.exit') {
          logger.debug('Exit button pressed');
          await i.deleteReply();
          collector.stop();
          return;
        }
  
        if (i.customId === 'button.next' || i.customId === 'button.prev') {
          index = handlePagination(i.customId, index, searchResult.data.length);
          embedData = searchResult.data[index];
          sendEmbed(i, embedData, audiobookBayUrl, index, searchResult);
        } else if (i.customId === 'button.download') {
          handleDownload(i, extendedBook, collector);
        } else if (i.customId === 'button.moreinfo') {
            extendedBook = await handleMoreInfo(i, searchResult.data[index], index, searchResult);
        } else if (i.customId === 'button.back' || i.customId === 'button.exit') {
          embedData = searchResult.data[index];
          sendEmbed(i, embedData, audiobookBayUrl, index, searchResult);
        }
      } catch (error) {
        handleError(error);
      }
    });
  }
  
  function handlePagination(buttonId: string, index: number, length: number): number {
    logger.debug(`Handling pagination: buttonId=${buttonId}, index=${index}, length=${length}`);
    if (buttonId === 'button.next') {
      index++;
      if (index >= length) index = 0;
    } else if (buttonId === 'button.prev') {
      index--;
      if (index < 0) index = length - 1;
    }
    return index;
  }
  
  async function handleMoreInfo(i: ButtonInteraction, data: any, index: number, searchResult: any): Promise<any | null> {
    // replace 'any' with the actual type of data
    disableButtons(i);
    const isSiteUp = await testSite();
    if (isSiteUp) {
      const id = data.id;
      const book = await getAudiobook(id);
      const extendedBook = {
        ...book,
        id: data.id,
        posted: data.posted,
        cover: data.cover
      };
      sendmoreinfoEmbed(i, extendedBook, audiobookBayUrl, index, searchResult);
      return extendedBook;
    } else {
      logger.error('The site is down at getAudiobook. Cannot get the audiobook.');
      senderrorEmbed(i);
      return null;
    }
  }
  
  function handleDownload(i: ButtonInteraction, extendedBook: any | null, collector: InteractionCollector<ButtonInteraction>) {
    // replace 'any' with the actual type of extendedBook
    if (!extendedBook) {
      logger.error('More info must be requested before downloading');
      return;
    }
    const userId = i.user.id;
    const bookName = extendedBook.title;
    const magnetUrl = extendedBook.torrent.magnetUrl;
    senddownloadinitEmbed(i, userId, bookName);
    queueUserTorrent(userId, bookName, i, magnetUrl);
    collector.stop();
  }
  
  function handleError(error: any) {
    // replace 'any' with the actual type of error
    const discordError = error as any;
    logger.error(`Error: ${discordError.message}`);
    throw error;
  }