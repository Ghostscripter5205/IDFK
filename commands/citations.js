const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('citations')
    .setDescription('Log a citation.')
    .addStringOption(opt => opt.setName('subject').setDescription('Person cited').setRequired(true))
    .addStringOption(opt => opt.setName('violation').setDescription('Violation or code').setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Attach an image').setRequired(false))
    .addStringOption(opt => opt.setName('notes').setDescription('Additional notes').setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
      return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
    }

    const subject = interaction.options.getString('subject');
    const violation = interaction.options.getString('violation');
    const image = interaction.options.getAttachment('image');
    const notes = interaction.options.getString('notes') || 'None';
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle('📝 Citation Log')
      .setColor(0xffff00)
      .setDescription(`Signed, ${nickname}`)
      .addFields(
        { name: 'Subject', value: subject },
        { name: 'Violation', value: violation },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    if (image) embed.setImage(image.url);

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ embeds: [embed] });

    const filePath = path.join(__dirname, '../data/citations.json');
    const log = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log.push({ subject, violation, notes, image: image?.url || null, staff: nickname, date: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(log, null, 2));

    await interaction.reply({ content: '✅ Citation logged.', ephemeral: true });
  }
};
