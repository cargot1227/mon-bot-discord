const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

  new SlashCommandBuilder()
  .setName('setup-tickets')
  .setDescription('Envoie le message de tickets dans le salon 🎫'),
  
  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Verrouille votre salon vocal'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Déverrouille votre salon vocal'),

  new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Invite un membre dans votre salon vocal')
    .addUserOption(option =>
      option.setName('membre').setDescription('Le membre à inviter').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre de votre salon vocal')
    .addUserOption(option =>
      option.setName('membre').setDescription('Le membre à expulser').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Renomme votre salon vocal')
    .addStringOption(option =>
      option.setName('nom').setDescription('Le nouveau nom du salon').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('bonjour')
    .setDescription('Le bot vous dit bonjour'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_DISCORD);

(async () => {
  console.log('Enregistrement des commandes slash...');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('Commandes enregistrées !');
})();
