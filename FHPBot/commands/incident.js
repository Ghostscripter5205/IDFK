const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('incident')
    .setDescription('Log an incident.')
    .addStringOption(opt => opt.setName('title').setDescription('Title of incident').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('What happened?').setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Attach an image').setRequired(false))
    .addStringOption(opt => opt.setName('notes').setDescription('Extra details').setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
      return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
    }

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const image = interaction.options.getAttachment('image');
    const notes = interaction.options.getString('notes') || 'None';
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle(`📂 Incident Report: ${title}`)
      .setColor(0x3366cc)
      .setDescription(`Signed, ${nickname}`)
      .addFields(
        { name: 'Description', value: description },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    if (image) embed.setImage(image.url);

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ embeds: [embed] });

    const filePath = path.join(__dirname, '../data/incidents.json');
    const log = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log.push({ title, description, notes, image: image?.url || null, staff: nickname, date: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(log, null, 2));

    await interaction.reply({ content: '✅ Incident logged.', ephemeral: true });
  }
};
