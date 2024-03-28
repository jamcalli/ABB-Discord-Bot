import { CommandInteraction, SlashCommandBuilder, ButtonInteraction, Collection, MessageComponentInteraction } from "discord.js";
import { AudioBookSearchResult } from "../../interface/search.interface";
import { search } from "../../index";
import { testSite } from "../../utils/siteTest";
import { audiobookBayUrl } from "../../constants";
import { sendEmbed, senderrorEmbed } from "../../utils/sendEmbed";
import { fixCoverUrls, trimSearchResults } from "../../utils/validation";
import { logger } from '../../bot';
import { bookBrowser } from "../../events/bookbrowser";
import { SearchResultItem } from "../../interface/scrape.interface";

// Define the command data 
const data = new SlashCommandBuilder()
    .setName("scrape")
    .setDescription("Validate spelling. Start with Author.")
    .addStringOption(option => 
        option.setName("author")
            .setDescription("The author to search for.")
            .setRequired(true)
    )
    .addStringOption(option => 
        option.setName("title")
            .setDescription("Adding a title or key words drastically improves the search results.")
            .setRequired(false)
    );

// Define the execute function 
async function execute(interaction: CommandInteraction) {
    // Initialize variables 
    let index = 0;
    let embedData;
    let searchResult: AudioBookSearchResult = { 
        data: [], 
        pagination: { currentPage: 0, totalPages: 1 },
    };

    // Check if the interaction is a chat input command 
    if (interaction.isChatInputCommand()) {

// Test the site
await interaction.reply({ content: 'Testing that AudioBookBay is up and running...', ephemeral: true });
const siteIsUp = await testSite();

// Check if the site is up
if (!siteIsUp) {
  await senderrorEmbed(interaction)
  return;
}

// Edit the reply
await interaction.editReply("Scaping for your query...");

// Get the search parameters
const searchAuthor = (interaction.options as any).getString('author');
const searchTitle = (interaction.options as any).getString('title');

// Define the search term and title filters
const searchTerm = searchAuthor;
const titleFilters = searchTitle ? [searchTitle] : [''];

// Log the search parameters
logger.info(`${'Order Received!'} - ${`Scraping results for - ${searchAuthor}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}`}`);

// Define the maximum number of pages to search
const maxPages = 5;
let currentPage = 0;

// Define a function to delay execution. Prevents banning while scraping
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search for audio books
// Search for audio books
while (currentPage < searchResult.pagination.totalPages && currentPage < maxPages) {
  currentPage += 1;
  try {
    // Get the next page of results
    const nextPage = await search(searchTerm.toLowerCase().trim(), currentPage);
    // Add the results to the search result data
    searchResult.data = searchResult.data.concat(nextPage.data);
    // Update the pagination
    searchResult.pagination = nextPage.pagination;
  } catch (error) {
    // Log the error
    logger.error(`Error object: ${JSON.stringify(error)}`);
    // Check if the error message is 'Nothing was found'
    if ((error as Error).message === 'Nothing was found') {
      // Log the error and edit the reply
      logger.error(`No results found for search term: ${searchTerm}`);
      await interaction.editReply(`No results found for author: ${searchTerm}. Please check your spelling and try again.`);
      break;
    } else {
      // Log the error
      logger.error(`Search error: ${error}`);
    }
  }

  // Add a delay between each page request
  await delay(1000);  // Delay of 1 second
}

// Apply additional filtering
if (titleFilters.length > 0) {
  // Filter the search result data by title
  searchResult.data = searchResult.data.filter(book => {
    let allMatch = true;
    titleFilters.forEach(titleFilter => {
      if (book.title.toLowerCase().indexOf(titleFilter.toLowerCase().trim()) < 0) {
        allMatch = false;
      }
    });
    return allMatch;
  });
}

// Check if no results were found
if (searchResult.data.length === 0) {
  // Log the error and edit the reply
  logger.error(`No results found for search term: ${searchTerm}`);
  await interaction.editReply(`No results found for author: ${searchTerm}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}. Please try another search.`);
  return; // Exit the function
}

// Initialize the position and last update time
let pos = 1;
let lastUpdateTime = Date.now();

// Loop through the search result data
for (const item of searchResult.data) {
  const now = Date.now();
  // Check if it's time to update the reply
  if (now - lastUpdateTime >= 5000) { // 5000 milliseconds = 5 seconds
    // Edit the reply
    await interaction.editReply(`Found ${pos} results for author ${searchTerm}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}!`);
    // Update the last update time
    lastUpdateTime = now;
  }
  // Increment the position
  pos += 1;
}

// Send a final update after the loop, in case the last few items didn't trigger an update
await interaction.editReply(`Found ${pos - 1} results for author ${searchTerm}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}!`);

// Log the search term, title filters, and result count
logger.info(`${'Search term:'} ${searchTerm}`)
logger.info(`${'Title Filters:'} ${titleFilters.join(',')}`)
logger.info(`${'Result Count:'} ${searchResult.data.length}`)

// Fix the cover URLs and trim the search results
searchResult = fixCoverUrls(searchResult);
searchResult = trimSearchResults(searchResult);

// Check if there are any results
if (searchResult && 'data' in searchResult && searchResult.data.length > 0) {

  // Sort the search result data
if (searchResult && 'data' in searchResult) {
  searchResult.data.sort((a: SearchResultItem, b: SearchResultItem) => {
    const langA = a.lang;
    const langB = b.lang;
    const formatA = a.info.format;
    const formatB = b.info.format;

    // Prioritize English language
    if (langA === 'English' && langB !== 'English') {
      return -1; // A comes first
    } else if (langA !== 'English' && langB === 'English') {
      return 1; // B comes first
    } else {
      // If languages are equal, prioritize by format
      if (formatA === 'M4B' && formatB !== 'M4B') {
        return -1; // A comes first
      } else if (formatA !== 'M4B' && formatB === 'M4B') {
        return 1; // B comes first
      } else if (formatA === 'MP3' && formatB !== 'MP3') {
        return -1; // A comes first
      } else if (formatA !== 'MP3' && formatB === 'MP3') {
        return 1; // B comes first
      } else {
        return 0; // Equal priority
      }
    }
  });
}
    }

// Get the data for the current index from the search results
embedData = searchResult.data[index];

// Initialize a variable to hold the message
let message;

// Try to send an embed message with the current data
try {
  message = await sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
} catch (error) {
  // Log an error if the embed message fails to send
  logger.error(`Failed to send embed: ${error}`);
}

// Check if the message was sent successfully
if (message) {
  // Define a filter for the message component collector
  const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
  
  // Create a message component collector with the defined filter
  const collector = message.createMessageComponentCollector({ filter });

  // Start the book browser with the collector and search results
  bookBrowser(collector, searchResult);
} else {
  // Log an error if the message is undefined
  logger.error('Message is undefined');
}

    }
  
  }

// Export the data and execute function
export { data, execute };