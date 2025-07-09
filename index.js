require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Skipped ${file}, missing "data" or "execute".`);
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const updatePresence = async () => {
    try {
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const members = await guild.members.fetch();
      const count = members.filter(m => m.roles.cache.has(process.env.TROOPER_ROLE_ID)).size;

      client.user.setPresence({
        activities: [{ name: `Helping ${count} Troopers with their duties!`, type: 0 }],
        status: 'online'
      });
    } catch (err) {
      console.error('⚠️ Failed to update presence:', err);
    }
  };

  await updatePresence();
  setInterval(updatePresence, 1000 * 60 * 5);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('🔁 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Error running /${interaction.commandName}:`, error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Error executing this command.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
