const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Message de bienvenue
client.on('guildMemberAdd', (member) => {
  const salon = member.guild.channels.cache.find(c => c.name === '🚪-𝑨𝒓𝒓𝒊𝒗𝒆́𝒆𝒔-𝑫𝒆́𝒑𝒂𝒓𝒕𝒔');
  if (!salon) return;

  const embed = new EmbedBuilder()
    .setTitle('🎉 Nouveau membre !')
    .setDescription(`Bienvenue **${member.user.username}** sur le serveur !\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256, extension: 'png' }))
    .setImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSASt2uDyQqNz8H8vBAdrRzsDi9l0K7CK_CMg&s')  // ← remplacez par une URL d'image
    .setColor('#57F287')
    .setFooter({ text: `ID : ${member.user.id}` })
    .setTimestamp();

  salon.send({ embeds: [embed] });
});

// Message de départ
client.on('guildMemberRemove', (member) => {
  const salon = member.guild.channels.cache.find(c => c.name === '🚪-𝑨𝒓𝒓𝒊𝒗𝒆́𝒆𝒔-𝑫𝒆́𝒑𝒂𝒓𝒕𝒔');
  if (!salon) return;

  const embed = new EmbedBuilder()
    .setTitle('👋 Départ')
    .setDescription(`**${member.user.username}** a quitté le serveur.\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256, extension: 'png' }))
    .setImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSASt2uDyQqNz8H8vBAdrRzsDi9l0K7CK_CMg&s')  // ← remplacez par une URL d'image
    .setColor('#ED4245')
    .setFooter({ text: `ID : ${member.user.id}` })
    .setTimestamp();

  salon.send({ embeds: [embed] });
});

// Commande !bonjour
client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.content === '!bonjour') {
    message.reply('Bonjour ! 👋');
  }
});

client.login(process.env.TOKEN_DISCORD);
