const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.content.startsWith(config.prefix) || message.author.bot) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);

        if (!command) return;

        const staffRole = message.guild.roles.cache.get(config.staffRoleId);
        if (!message.member.roles.cache.has(staffRole.id)) {
            return message.reply('You do not have permission to use this command.');
        }

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('There was an error executing that command.');
        }
    }
};