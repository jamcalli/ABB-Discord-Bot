import { client } from "../bot"
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import pc from "picocolors"
import { AudioBookSearchResult } from "../interface/search";
import { audiobook, search } from "../index";
import { getAudiobook } from "../utils/getAudiobook";
import { testSite } from "../utils/siteTest";
import { data } from "cheerio/lib/api/attributes";
import { audiobookBayUrl } from "../constants";
import { sendEmbed, sendmoreinfoEmbed } from "../utils/sendEmbed";
import { getMagnetLink } from "../utils/getmagnet";
import { downloadMagnet, checkAndRemoveCompletedTorrents, qbittorrent } from "../qbittorrent";
import { searchAudiobooks } from "../utils/searchAudiobooks";
import { fixCoverUrls } from "../utils/validateUrl";

export const data1 = new SlashCommandBuilder()
  .setName("scrape")
  .setDescription("Validate spelling. Start with Author.")
  .addStringOption(option =>
    option.setName("author")
      .setDescription("The author to search for")
      .setRequired(true))
  .addStringOption(option =>  
    option.setName("title")
      .setDescription("Add title to refine search")
      .setRequired(false)
  );

  export async function execute(interaction: CommandInteraction) {
    if (!interaction.isCommand()) return;
  
    // Call the testSite
    await interaction.reply({ content: 'Testing that AudioBookBay is up and running...', ephemeral: true });
    const siteIsUp = await testSite();
  
    if (!siteIsUp) {
      await interaction.editReply(`AudioBookBay appears to be down. Please try again later.`);
      return;
    }
  
    await interaction.editReply("Scaping for your query...");

  const searchAuthor = (interaction.options as any).getString('author');
  const searchTitle = (interaction.options as any).getString('title');

  const searchTerm = searchAuthor;
  const titleFilters = searchTitle ? [searchTitle] : [''];
  
  console.log(`${pc.green('Order Received!')} - ${pc.gray(`Scraping results for - ${searchAuthor}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}`)}`);

  async function main() {

    // setup variables
    const maxPages = 5;
    let currentPage = 0;
    let searchResult = {
      data: [],
      pagination: { currentPage: 0, totalPages: 1 },
    } as AudioBookSearchResult;

    // search for audio books
    while (currentPage < searchResult.pagination.totalPages && currentPage < maxPages) {
      currentPage += 1;
      try {
        const nextPage = await search(searchTerm.toLowerCase().trim(), currentPage);
        searchResult.data = searchResult.data.concat(nextPage.data); // add results to original array
        searchResult.pagination = nextPage.pagination; // update pagination
      } catch (error) {
        if ((error as Error).message === 'Nothing was found') {
          console.error(pc.red(`No results found for search term: ${searchTerm}`));
          return interaction.editReply(`No results found for author: ${searchTerm}. Please check your spelling and try again.`);
        } else {
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
          if(book.title.toLowerCase().indexOf(titleFilter.toLowerCase().trim()) < 0) {
            allMatch = false;
          }
        });
        return allMatch;
      });
    }
  
    let pos = 1;
    for (const item of searchResult.data) {

    // Wait for 1 second before sending the next message. Avoids rate limiting
    //  await new Promise(resolve => setTimeout(resolve, 1000));

     await interaction.editReply(`Found ${pos} results for author ${searchTerm}${titleFilters[0] !== '' ? ' - and title filters: ' + titleFilters : ''}!`);

    //  console.log(`${pos} - ${pc.green(item.title)} - ${pc.gray(item.id)}`)
      
      pos += 1;
    }
    console.log(`${pc.yellow('Search term:')} ${searchTerm}`)
    console.log(`${pc.yellow('Title Filters:')} ${titleFilters.join(',')}`)
    console.log(`${pc.yellow('Result Count:')} ${searchResult.data.length}`)

    searchResult = fixCoverUrls(searchResult);

    return searchResult;

  }

  main().then((searchResult) => {
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
   
      let index = 0;
      let embedData = searchResult.data[index];
            
      sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
      
      let extendedBook: any;

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  await interaction.deferUpdate().catch((error) => {
    if (error instanceof Error) {
      const discordError = error as any;
      if (discordError.name === 'DiscordAPIError' && discordError.code === 10062) {
        console.error('Unable to defer update: Unknown interaction');
        return;
      }
    }
    throw error;
  });

  if (interaction.customId === 'button.next') {
    index++;
    if (index >= searchResult.data.length) index = 0; // Loop back to the start if we've reached the end
    embedData = searchResult.data[index];
    sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
  } else if (interaction.customId === 'button.prev') {
    index--;
    if (index < 0) index = searchResult.data.length - 1; // Loop back to the end if we've reached the start
    embedData = searchResult.data[index];
    sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
  } else if (interaction.customId === 'button.download') {
    if (!extendedBook) {
      console.error('More info must be requested before downloading');
      return;
    }

        downloadMagnet(extendedBook.torrent.magnetUrl);
        const channelId = interaction.channelId;
        const userId = interaction.user.id;
        await checkAndRemoveCompletedTorrents(qbittorrent, userId, interaction);
        //await interaction.reply(`Hello, <@${interaction.user.id}>!`)

  } else if (interaction.customId === 'button.moreinfo') {
    const id = searchResult.data[index].id;
    const book = await getAudiobook(id);
    extendedBook = {
      ...book,
      id: searchResult.data[index].id,
      posted: searchResult.data[index].posted,
      cover: searchResult.data[index].cover
    };
    sendmoreinfoEmbed(interaction, extendedBook, audiobookBayUrl, index, searchResult);
  } else if (interaction.customId === 'button.back') {
    embedData = searchResult.data[index];
    sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
  } else {
    embedData = searchResult.data[index];
    sendEmbed(interaction, embedData, audiobookBayUrl, index, searchResult);
  }
});

    }

  } else {
    console.log('No search results found.');
    return interaction.editReply(`No results found for author: ${searchTerm}. Please check your spelling and try again.`);
  }
  
  }).catch((ex) => {
    console.error(pc.red(`Error: ${ex}`))
  });

}
