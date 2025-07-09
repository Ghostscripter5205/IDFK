const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bolo')
    .setDescription('Issue a BOLO alert.')
    .addStringOption(opt => opt.setName('target').setDescription('Who/what the BOLO is for').setRequired(true))
    .addStringOption(opt => opt.setName('details').setDescription('Info about the subject or vehicle').setRequired(true))
    .addRoleOption(opt => opt.setName('pingrole').setDescription('Role to ping with the BOLO').setRequired(true))
    .addStringOption(opt => opt.setName('notes').setDescription('Optional notes').setRequired(false))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Attach an image')),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
      return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
    }

    const target = interaction.options.getString('target');
    const details = interaction.options.getString('details');
    const notes = interaction.options.getString('notes') || 'None';
    const pingRole = interaction.options.getRole('pingrole');
    const image = interaction.options.getAttachment('image');
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle('📢 BOLO Alert')
      .setColor(0xff3333)
      .setDescription(`Signed, ${nickname}`)
      .addFields(
        { name: 'Target', value: target },
        { name: 'Details', value: details },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    if (image) embed.setImage(image.url);

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ content: `${pingRole}`, embeds: [embed] });

    const filePath = path.join(__dirname, '../data/bolo.json');
    const log = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log.push({ target, details, notes, staff: nickname, date: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(log, null, 2));

    await interaction.reply({ content: '✅ BOLO posted.', ephemeral: true });
  }
};
