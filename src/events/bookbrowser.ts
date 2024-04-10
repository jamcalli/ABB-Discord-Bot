import { getAudiobook } from "../utils/getAudiobook.ts";
import { testSite } from "../utils/siteTest.ts";
import { audiobookBayUrl } from "../constants.ts";
import { sendEmbed, sendmoreinfoEmbed, disableButtons, senderrorEmbed, senddownloadinitEmbed } from "../utils/sendEmbed.ts";
import { queueUserTorrent } from "../utils/qbittorrent.ts";
import { logger } from '../bot.ts';
import { InteractionCollector, ButtonInteraction } from 'discord.js';
import { SearchResult, EmbedData, ExtendedBook } from '../interface/bookbrowser.interface';

// The main function that handles the interaction with the book browser
export function bookBrowser(
  collector: InteractionCollector<ButtonInteraction>, // The collector that collects button interactions
  searchResult: SearchResult, // The search result data
) {
  let index = 0; // The current index in the search result data
  let extendedBook: ExtendedBook | null = null; // The current extended book data

  // When a button interaction is collected
  collector.on('collect', async (i: ButtonInteraction) => {
    let embedData: EmbedData = searchResult.data[index]; // The current embed data

    try {
      logger.debug(`Processing interaction with customId: ${i.customId}`);
      await i.deferUpdate(); // Defer the update of the interaction

      // If the exit button is pressed
      if (i.customId === 'button.exit') {
        logger.debug('Exit button pressed');
        await i.deleteReply(); // Delete the reply
        collector.stop(); // Stop the collector
        return;
      }

      // If the next or previous button is pressed
      if (i.customId === 'button.next' || i.customId === 'button.prev') {
        index = handlePagination(i.customId, index, searchResult.data.length); // Handle the pagination
        embedData = searchResult.data[index]; // Update the embed data
        sendEmbed(i, embedData, audiobookBayUrl, index, searchResult); // Send the embed
      } 
      // If the download button is pressed
      else if (i.customId === 'button.download') {
        if (!extendedBook) {
          logger.error('More info must be requested before downloading');
          return;
        }
        handleDownload(i, extendedBook, collector); // Handle the download
      } 
      // If the more info button is pressed
      else if (i.customId === 'button.moreinfo') {
        extendedBook = await handleMoreInfo(i, searchResult.data[index], index, searchResult); // Handle the more info request
        if (!extendedBook) {
          logger.error('Failed to get more info');
          return;
        }
      } 
      // If the back or exit button is pressed
      else if (i.customId === 'button.back' || i.customId === 'button.exit') {
        embedData = searchResult.data[index]; // Update the embed data
        sendEmbed(i, embedData, audiobookBayUrl, index, searchResult); // Send the embed
      }
    } catch (error: unknown) {
      // If the error is an instance of Error
      if (error instanceof Error) {
        handleError(error); // Handle the error
      } else {
        // If the error is not an instance of Error
        logger.error(error);
      }
    }
  });
} 

// Function to handle the pagination
function handlePagination(buttonId: string, index: number, length: number): number {
  logger.debug(`Handling pagination: buttonId=${buttonId}, index=${index}, length=${length}`);
  // If the next button is pressed
  if (buttonId === 'button.next') {
    index++; // Increment the index
    if (index >= length) index = 0; // If the index is out of bounds, reset it to 0
  } 
  // If the previous button is pressed
  else if (buttonId === 'button.prev') {
    index--; // Decrement the index
    if (index < 0) index = length - 1; // If the index is out of bounds, set it to the last element
  }
  return index; // Return the updated index
}
  
// Function to handle the more info request
async function handleMoreInfo(i: ButtonInteraction, data: EmbedData, index: number, searchResult: SearchResult): Promise<ExtendedBook | null> {
  disableButtons(i); // Disable the buttons
  const isSiteUp = await testSite(); // Test if the site is up
  if (isSiteUp) {
    const id = data.id; // Get the id from the data
    const book = await getAudiobook(id); // Get the audiobook data
    const extendedBook = {
      ...book, // Spread the book data
      id: data.id, // Add the id from the data
      posted: data.posted, // Add the posted date from the data
      cover: data.cover, // Add the cover from the data
      info: data.info, 
    };
    sendmoreinfoEmbed(i, extendedBook, audiobookBayUrl, index, searchResult); // Send the more info embed
    return extendedBook; // Return the extended book data
  } else {
    logger.error('The site is down at getAudiobook. Cannot get the audiobook.'); // Log the error
    senderrorEmbed(i); // Send the error embed
    return null; // Return null
  }
}

// Function to handle the download
function handleDownload(i: ButtonInteraction, extendedBook: ExtendedBook | null, collector: InteractionCollector<ButtonInteraction>) {
  if (!extendedBook) {
    logger.error('More info must be requested before downloading'); // Log the error
    return;
  }
  const userId = i.user.id; // Get the user id
  const bookName = extendedBook.title; // Get the book name
  const magnetUrl = extendedBook.torrent.magnetUrl; // Get the magnet url
  if (magnetUrl === undefined) {
    logger.error('Magnet URL is undefined'); // Log the error
    return;
  }
  senddownloadinitEmbed(i, userId, bookName ); // Send the download init embed
  queueUserTorrent(userId, bookName, i, magnetUrl); // Queue the user torrent
  collector.stop(); // Stop the collector
}

// Function to handle the error
function handleError(error: Error) {
  const discordError = error as Error; // Cast the error to an Error
  logger.error(`Error: ${discordError.message}`); // Log the error message
  throw error; // Throw the error
}