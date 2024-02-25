import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { logger } from '../bot'; 
import { EmbedData, Book, SearchResult, Torrent, Interaction, Client } from '../interface/sendembed.interface';

// Function to trim the description if it exceeds 4000 characters
function trimDescription(description: string): string {
  const maxLength = 4000;
  if (description.length > maxLength) {
    logger.info('Description length exceeds 4000 characters, trimming it.');
    return description.substring(0, maxLength) + '...';
  }
  return description;
}

// Function to trim the title if it exceeds 256 characters
function trimTitle(title: string): string {
  const maxLength = 256;
  if (title.length > maxLength) {
    logger.info('Title length exceeds 256 characters, trimming it.');
    return title.substring(0, maxLength - 3) + '...';
  }
  return title;
}

// Function to send an embed message with audiobook details
export async function sendEmbed(
  interaction: Interaction, 
  embedData: EmbedData, 
  audiobookBayUrl: string, 
  index: number, 
  searchResult: SearchResult
) {
  // Create the embed message
  const embed = new EmbedBuilder()
  .setTitle(trimTitle(embedData.title))
  .setURL(audiobookBayUrl+'/'+embedData.id)
  .setColor('#ffcc00')
  .setDescription('Click Get More Info to view more details about this audiobook. Please read the description for information regarding file type etc (when missing from general info). Download button will be available there.')
  .setThumbnail('https://i.imgur.com/ibmpIeR.png')
  .addFields({name:'Language', value: embedData.lang, inline: true})
  .addFields({name:'Format', value: embedData.info.format, inline: true})
  .addFields({name: 'Bitrate', value: embedData.info.unit, inline: true})
  .addFields({name: 'Size', value: embedData.info.size+embedData.info.sizeUnit, inline: true})
  .setImage(embedData.cover)
  .setFooter({text: 'Posted on '+embedData.posted});

  // Create the buttons for the message
  const buttonprev = new ButtonBuilder()
  .setCustomId('button.prev')
  .setLabel('Prev')
  .setStyle(ButtonStyle.Primary);

  const buttonnext = new ButtonBuilder()
  .setCustomId('button.next')
  .setLabel('Next')
  .setStyle(ButtonStyle.Primary);

  const buttonmore = new ButtonBuilder()
  .setCustomId('button.moreinfo')
  .setLabel('Get More Info')
  .setStyle(ButtonStyle.Success);

  const buttonexit = new ButtonBuilder()
  .setCustomId('button.exit')
  .setLabel('Exit')
  .setStyle(ButtonStyle.Danger);

  // Add the buttons to an action row
  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(buttonprev, buttonmore, buttonnext, buttonexit);

  // Edit the reply with the embed message and the buttons
  const message = await interaction.editReply({
    content: `Viewing Audiobook: ${index + 1} of ${searchResult.data.length}`,
    embeds: [embed],
    components: [buttonRow],
    fetchReply: true,
  });

  return message;
}

// Similar functions for sending more info embed, download embed, download init embed, download complete DM, error embed, and disabling buttons follow...

  export async function sendmoreinfoEmbed(
    interaction: Interaction, 
    book: Book, 
    audiobookBayUrl: string, 
    index: number, 
    searchResult: SearchResult
  ) {
    // Replace empty strings with 'NA'
    book.lang = book.lang || 'NA';
    book.specs.format = book.specs.format || 'NA';
    book.specs.bitrate = book.specs.bitrate || 'NA';
  
    const embed = new EmbedBuilder()
      .setTitle(trimTitle(book.title))
      .setURL(audiobookBayUrl+'/'+book.id)
      .setColor('#ffcc00')
      .setDescription(trimDescription(book.description))
      .setThumbnail(book.cover)
      .addFields([
        {name:'Language', value: book.lang, inline: true},
        {name:'Format', value: book.specs.format, inline: true},
        {name: 'Bitrate', value: book.specs.bitrate, inline: true}
      ])
      .setFooter({text: 'Posted on '+book.posted});
  
    const buttonback = new ButtonBuilder()
      .setCustomId('button.back')
      .setLabel('Go Back')
      .setStyle(ButtonStyle.Danger);
  
    const buttondownloadAudiobook = new ButtonBuilder()
      .setCustomId('button.download')
      .setLabel('Download this Audiobook!')
      .setStyle(ButtonStyle.Success);
  
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttonback, buttondownloadAudiobook);
  
const message = await interaction.editReply({
      content: `Viewing Audiobook: ${index + 1} of ${searchResult.data.length}`,
      embeds: [embed],
      components: [buttonRow],
      fetchReply: true,
    });
  
    return message;
  }

  export async function senddownloadEmbed(
    interaction: Interaction,
    userId: string,
    torrent: Torrent
  ) {
    const embed = new EmbedBuilder()
      .setTitle(`Order received!`)
      .setColor('#99cc33')
      .setDescription('You will receive notifications regarding your downloads progress. Happy listening!')
      .setImage('https://i.imgur.com/dUYWB1u.png')
      .setFooter({text: 'Thank you for using AudiobookRequester!'});
  
    await interaction.editReply({
      content: `<@${userId}>, your order has been placed and the AudioBook ${torrent.name} is downloading. You will receive a DM when it is available on Plex.`,
      embeds: [embed],
      components: [],
    });
  }

  export async function senddownloadinitEmbed(
    interaction: Interaction,
    userId: string,
    initialTorrent: string
  ) {
    const embed = new EmbedBuilder()
      .setTitle(`Order received!`)
      .setColor('#99cc33')
      .setDescription('You will receive notifications regarding your downloads progress. Happy listening!')
      .setImage('https://i.imgur.com/ibmpIeR.png')
      .setFooter({text: 'Thank you for using AudiobookRequester!'});
  
    await interaction.editReply({
      content: `<@${userId}>, your order has been placed and it is in the queue. ${initialTorrent} will begin downloading shortly. You will receive a mentions on the progress.`,
      embeds: [embed],
      components: [],
    });
  }

  export async function senddownloadcompleteDM(
    client: Client,
    userId: string,
    torrent: Torrent
  ) {
    const embed = new EmbedBuilder()
      .setTitle(`Enjoy your book!`)
      .setColor('#339900')
      .setImage('https://i.imgur.com/ibmpIeR.png')
      .setFooter({text: 'Thank you for using AudioBook Bay Discord Bot!'});
  
      const user = await client.users.fetch(userId);

    await user.send({
      content: `The AudioBook ${torrent.name} has completed downloading. Check Plex for the new content.`,
      embeds: [embed],
    });
  }

  export async function senderrorEmbed(
    interaction: Interaction
  ) {
    const embed = new EmbedBuilder()
      .setTitle(`Ohhhhh shit!`)
      .setDescription(`AudioBook Bay appears to have gone down... Try again shortly!`)
      .setColor('#cc3300')
      .setImage('https://i.imgur.com/QTlHUGH.png')
      .setFooter({text: 'Thank you for using AudioBook Bay Discord Bot!'});
  
    await interaction.editReply({
      content: '',
      embeds: [embed],
      components: [],
    });
  }
  
  export async function disableButtons(interaction: any) {
    const buttonprev = new ButtonBuilder()
      .setCustomId('button.prev')
      .setLabel('Prev')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true); 
  
    const buttonmore = new ButtonBuilder()
      .setCustomId('button.moreinfo')
      .setLabel('Working on it...')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true); 
  
    const buttonnext = new ButtonBuilder()
      .setCustomId('button.next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true); 
  
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttonprev, buttonmore, buttonnext);
  
    await interaction.editReply({
      components: [buttonRow],
    });
  }