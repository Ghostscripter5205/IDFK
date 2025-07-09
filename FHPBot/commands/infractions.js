const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infraction')
    .setDescription('Issue an infraction to a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to infract').setRequired(true))
    .addStringOption(opt => opt.setName('action').setDescription('Action taken (e.g. warning, strike)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the infraction').setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Attach an image').setRequired(false))
    .addStringOption(opt => opt.setName('notes').setDescription('Additional notes').setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.promoRoleId)) {
      return interaction.reply({ content: '🚫 Only promo team can issue infractions.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const action = interaction.options.getString('action');
    const reason = interaction.options.getString('reason');
    const notes = interaction.options.getString('notes') || 'None';
    const image = interaction.options.getAttachment('image');
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle('📛 Infraction Issued')
      .setDescription(`Signed, ${nickname}`)
      .setColor(0xff0000)
      .addFields(
        { name: 'User', value: `${target}` },
        { name: 'Action', value: action },
        { name: 'Reason', value: reason },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    if (image) embed.setImage(image.url);

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ content: `${target}`, embeds: [embed] });

    try {
      await target.send({ embeds: [embed] });
    } catch {
      // user has DMs closed
    }

    await interaction.reply({ content: '✅ Infraction logged.', ephemeral: true });

    const filePath = path.join(__dirname, '../data/infractions.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.push({
      user: target.tag,
      action,
      reason,
      notes,
      image: image?.url || null,
      staff: nickname,
      date: new Date().toISOString()
    });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
};
