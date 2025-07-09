const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promotion')
    .setDescription('Log a user promotion.')
    .addUserOption(opt => opt.setName('user').setDescription('User promoted').setRequired(true))
    .addRoleOption(opt => opt.setName('newrank').setDescription('New rank/role').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Why were they promoted?').setRequired(true))
    .addStringOption(opt => opt.setName('notes').setDescription('Extra notes')),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.promoRoleId)) {
      return interaction.reply({ content: '🚫 Only promo team can promote users.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const rank = interaction.options.getRole('newrank');
    const reason = interaction.options.getString('reason');
    const notes = interaction.options.getString('notes') || 'None';
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle('🎖️ Promotion Logged')
      .setDescription(`Signed, ${nickname}`)
      .setColor(0x00ff99)
      .addFields(
        { name: 'User', value: `${user}` },
        { name: 'New Rank', value: `${rank}` },
        { name: 'Reason', value: reason },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ embeds: [embed] });
    await user.send({ embeds: [embed] }).catch(() => {});
    await interaction.reply({ content: '✅ Promotion logged.', ephemeral: true });

    const filePath = path.join(__dirname, '../data/promotions.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.push({ user: user.tag, rank: rank.name, reason, notes, staff: nickname, date: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
};
