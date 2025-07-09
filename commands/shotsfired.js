const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shotsfired')
    .setDescription('Log a shots fired incident.')
    .addStringOption(opt => opt.setName('location').setDescription('Location of incident').setRequired(true))
    .addStringOption(opt => opt.setName('details').setDescription('What happened?').setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Attach an image').setRequired(false))
    .addStringOption(opt => opt.setName('notes').setDescription('Additional info').setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
      return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
    }

    const location = interaction.options.getString('location');
    const details = interaction.options.getString('details');
    const image = interaction.options.getAttachment('image');
    const notes = interaction.options.getString('notes') || 'None';
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle('🔫 Shots Fired Log')
      .setColor(0xff9900)
      .setDescription(`Signed, ${nickname}`)
      .addFields(
        { name: 'Location', value: location },
        { name: 'Details', value: details },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    if (image) embed.setImage(image.url);

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ embeds: [embed] });

    const filePath = path.join(__dirname, '../data/shotsfired.json');
    const log = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log.push({ location, details, notes, image: image?.url || null, staff: nickname, date: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(log, null, 2));

    await interaction.reply({ content: '✅ Shots fired log submitted.', ephemeral: true });
  }
};
