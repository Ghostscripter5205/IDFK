const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arrests')
    .setDescription('Log an arrest.')
    .addStringOption(opt => opt.setName('subject').setDescription('Who was arrested?').setRequired(true))
    .addStringOption(opt => opt.setName('charges').setDescription('Charges filed').setRequired(true))
    .addUserOption(opt => opt.setName('officer').setDescription('Arresting officer').setRequired(false))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Attach an image').setRequired(false))
    .addStringOption(opt => opt.setName('notes').setDescription('Additional notes').setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
      return interaction.reply({ content: '🚫 You do not have permission.', ephemeral: true });
    }

    const subject = interaction.options.getString('subject');
    const charges = interaction.options.getString('charges');
    const officer = interaction.options.getUser('officer');
    const image = interaction.options.getAttachment('image');
    const notes = interaction.options.getString('notes') || 'None';
    const nickname = interaction.member.nickname || interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle('📘 Arrest Log')
      .setColor(0x0099ff)
      .setDescription(`Signed, ${nickname}`)
      .addFields(
        { name: 'Subject', value: subject },
        { name: 'Charges', value: charges },
        { name: 'Notes', value: notes }
      )
      .setTimestamp();

    if (officer) embed.addFields({ name: 'Arresting Officer', value: `${officer} (${officer.tag})` });
    if (image) embed.setImage(image.url);

    const logsChannel = await client.channels.fetch(config.logsChannelId);
    await logsChannel.send({ content: officer ? `${officer}` : null, embeds: [embed] });

    const filePath = path.join(__dirname, '../data/arrests.json');
    const log = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log.push({
      subject,
      charges,
      notes,
      arrestingOfficer: officer ? { id: officer.id, tag: officer.tag } : null,
      image: image?.url || null,
      staff: nickname,
      date: new Date().toISOString()
    });
    fs.writeFileSync(filePath, JSON.stringify(log, null, 2));

    await interaction.reply({ content: '✅ Arrest logged.', ephemeral: true });
  }
};
