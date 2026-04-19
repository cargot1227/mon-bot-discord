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
    .setName('warn')
    .setDescription('Avertir un membre')
    .addUserOption(option => option.setName('membre').setDescription('Le membre à avertir').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('La raison').setRequired(true)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Rendre muet un membre')
    .addUserOption(option => option.setName('membre').setDescription('Le membre à mute').setRequired(true))
    .addStringOption(option => option.setName('duree').setDescription('Durée (ex: 10m, 1h, 1j)').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le mute d\'un membre')
    .addUserOption(option => option.setName('membre').setDescription('Le membre à unmute').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre')
    .addUserOption(option => option.setName('membre').setDescription('Le membre à bannir').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un membre')
    .addStringOption(option => option.setName('id').setDescription('L\'ID du membre à débannir').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .addUserOption(option => option.setName('membre').setDescription('Le membre à expulser').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('La raison').setRequired(false)),

  new SlashCommandBuilder()
    .setName('history')
    .setDescription('Voir l\'historique des sanctions d\'un membre')
    .addUserOption(option => option.setName('membre').setDescription('Le membre').setRequired(true)),

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
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('Commandes enregistrées !');
})();
