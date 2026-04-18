const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_DISCORD);

(async () => {
  console.log('Suppression des commandes globales...');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [] }
  );
  console.log('Commandes globales supprimées !');
})();