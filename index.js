const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content === '!bonjour') {
    message.reply('Bonjour ! 👋');
  }
});

client.login(process.env.TOKEN_DISCORD);