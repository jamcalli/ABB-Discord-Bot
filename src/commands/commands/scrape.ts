import { CommandInteraction, SlashCommandBuilder, ButtonInteraction, Collection, MessageComponentInteraction } from "discord.js";
import { AudioBookSearchResult } from "../../interface/search";
import { search } from "../../index";
import { testSite } from "../../utils/siteTest";
import { audiobookBayUrl } from "../../constants";
import { sendEmbed, senderrorEmbed } from "../../utils/sendEmbed";
import { fixCoverUrls, trimSearchResults } from "../../utils/validation";
import { logger } from '../../bot';
import { bookBrowser } from "../../events/bookbrowser";

const data = new SlashCommandBuilder()
    .setName("scrape")
    .setDescription("Validate spelling. Start with Author.")
    .addStringOption(option =>
      option.setName("author")
        .setDescription("The author to search for.")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Adding a title or key words drastically improves the search results.")
        .setRequired(false));

async function execute(interaction: CommandInteraction) {

  let index = 0;
  let embedData;
  let searchResult: AudioBookSearchResult = {
    data: [],
    pagination: { currentPage: 0, totalPages: 1 },
  };

    if (interaction.isChatInputCommand()) {

    // Call the testSite
    await interaction.reply({ content: 'Testing that AudioBookBay is up and running...', ephemeral: true });
    const siteIsUp = await testSite();
  
    if (!siteIsUp) {
      await senderrorEmbed(interaction)
      return;
    }
  
    await interaction.editReply("Scaping for your query...");
  
    const searchAuthor = (interaction.options as any).getString('author');
    const searchTitle = (interaction.options as any).getString('title');
  
    const searchTerm = searchAuthor;
    const titleFilters = searchTitle ? [searchTitle] : [''];
  
    logger.info(`${'Order Received!'} - ${`Scraping results for - ${searchAuthor}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}`}`);
  
    // setup variables
    const maxPages = 5;
    let currentPage = 0;
  
    // search for audio books
    while (currentPage < searchResult.pagination.totalPages && currentPage < maxPages) {
      currentPage += 1;
      try {
        const nextPage = await search(searchTerm.toLowerCase().trim(), currentPage);
        searchResult.data = searchResult.data.concat(nextPage.data); // add results to original array
        searchResult.pagination = nextPage.pagination; // update pagination
      } catch (error) {
        if ((error as Error).message === 'Nothing was found') {
          logger.error(`No results found for search term: ${searchTerm}`);
          return interaction.editReply(`No results found for author: ${searchTerm}. Please check your spelling and try again.`);
        } else {
          logger.error(`Search error: ${error}`);
          throw error; // Re-throw the error if it's not the "Nothing was found" error
        }
      }
    }
    // apply additional filtering
    if (titleFilters.length > 0) {
      searchResult.data = searchResult.data.filter(book => {
        // filter by title
        let allMatch = true;
        titleFilters.forEach(titleFilter => {
          if (book.title.toLowerCase().indexOf(titleFilter.toLowerCase().trim()) < 0) {
            allMatch = false;
          }
        });
        return allMatch;
      });
    }
  
    let pos = 1;
    for (const item of searchResult.data) {
      await interaction.editReply(`Found ${pos} results for author ${searchTerm}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}!`);
      pos += 1;
    }
    logger.info(`${'Search term:'} ${searchTerm}`)
    logger.info(`${'Title Filters:'} ${titleFilters.join(',')}`)
    logger.info(`${'Result Count:'} ${searchResult.data.length}`)
  
    searchResult = fixCoverUrls(searchResult);
    searchResult = trimSearchResults(searchResult);
  
    if (searchResult && 'data' in searchResult && searchResult.data.length > 0) {
      interface SearchResultItem {
        info: {
          format: string;
        };
      }
  
      if (searchResult && 'data' in searchResult) {
        searchResult.data.sort((a: SearchResultItem, b: SearchResultItem) => {
          const formatA = a.info.format;
          const formatB = b.info.format;
  
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
        });
      }
    }

    embedData = searchResult.data[index];

    let message;
try {
  message = await sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
} catch (error) {
  console.error(`Failed to send embed: ${error}`);
}

const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
const collector = message.createMessageComponentCollector({ filter });

bookBrowser(collector, searchResult);

    
  }
  }

export { data, execute };

          


  