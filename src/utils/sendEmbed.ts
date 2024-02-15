import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
//import { logoFile } from "../config";

export async function sendEmbed(
    interaction: any, 
    embedData: any, 
    audiobookBayUrl: string, 
    index: number, 
    searchResult: any

  ) {

    //const imageUrl = validateAndFixUrl(embedData.cover);

    const embed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setURL(audiobookBayUrl+'/'+embedData.id)
      .setColor('#0099ff')
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

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttonprev, buttonmore, buttonnext);
  
    await interaction.editReply({
      content: `Viewing Audiobook: ${index + 1} of ${searchResult.data.length}`,
      embeds: [embed],
      components: [buttonRow],
    });
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
      .setColor('#0099ff')
      .setDescription(book.description)
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
  
    await interaction.editReply({
      content: `Viewing Audiobook: ${index + 1} of ${searchResult.data.length}`,
      embeds: [embed],
      components: [buttonRow],
    });
  }

  export async function senddownloadEmbed(
    interaction: any,
    userId: string,
    torrent: { name: string }
  ) {
    const embed = new EmbedBuilder()
      .setTitle(`Order received!`)
      .setColor('#0099ff')
      .setDescription('You will receive notifications regarding your downloads progress. Happy listening!')
      .setImage('https://i.imgur.com/ibmpIeR.png')
      .setFooter({text: 'Thank you for using AudiobookBay Discord Bot!'});
  
    await interaction.editReply({
      content: `<@${userId}>, your order has been placed and the torrent ${torrent.name} is downloading. You will receive a mention when it is available on Plex.`,
      embeds: [embed],
      //files: [logoFile],
    });
  }

  export async function senddownloadcompleteEmbed(
    interaction: any,
    userId: string,
    torrent: { name: string }
  ) {
    const embed = new EmbedBuilder()
      .setTitle(`Enjoy your book!`)
      .setColor('#0099ff')
      .setImage('https://i.imgur.com/ibmpIeR.png')
      .setFooter({text: 'Thank you for using AudioBook Bay Discord Bot!'});
  
    await interaction.editReply({
      content: `<@${userId}>, the torrent ${torrent.name} has completed downloading. Check Plex for the new content.`,
      embeds: [embed],
    });
  }
  