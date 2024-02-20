import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, MessageComponentInteraction } from "discord.js";
import { logger } from '../bot'; 

function trimDescription(description: string): string {
  const maxLength = 4000;
  if (description.length > maxLength) {
    logger.info('Description length exceeds 4000 characters, trimming it.');
    return description.substring(0, maxLength) + '...';
  }
  return description;
}

export async function sendEmbed(
  interaction: any, 
  embedData: any, 
  audiobookBayUrl: string, 
  index: number, 
  searchResult: any
) {
  const embed = new EmbedBuilder()
  .setTitle(embedData.title)
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

const buttonRow = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(buttonprev, buttonmore, buttonnext, buttonexit);

  const message = await interaction.editReply({
    content: `Viewing Audiobook: ${index + 1} of ${searchResult.data.length}`,
    embeds: [embed],
    components: [buttonRow],
    fetchReply: true,
  });

  return message;
}

  export async function sendmoreinfoEmbed(
    interaction: any, 
    book: any, 
    audiobookBayUrl: string, 
    index: number, 
    searchResult: any
  ) {
    // Replace empty strings with 'NA'
    book.lang = book.lang || 'NA';
    book.specs.format = book.specs.format || 'NA';
    book.specs.bitrate = book.specs.bitrate || 'NA';
  
    const embed = new EmbedBuilder()
      .setTitle(book.title)
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
    interaction: any,
    userId: string,
    torrent: { name: string }
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
    interaction: any,
    userId: string,
    initialTorrent: { name: string }
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
    client: any,
    userId: string,
    torrent: { name: string }
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
    interaction: any
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