const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Stocke les salons créés automatiquement
const salonsPrives = new Map();

// ——— Création automatique du salon vocal ———
client.on('voiceStateUpdate', async (oldState, newState) => {
  const salonCreer = newState.guild.channels.cache.find(c => c.name === '➕ 𝑪𝒓𝒆́𝒆𝒓-𝒖𝒏-𝑺𝒂𝒍𝒐𝒏');

  // Quand quelqu'un rejoint "Créer-un-Salon"
  if (newState.channelId === salonCreer?.id) {
    const membre = newState.member;

    // Crée le salon vocal dans la même catégorie
    const nouveauSalon = await newState.guild.channels.create({
      name: `🔊 ${membre.user.username}`,
      type: ChannelType.GuildVoice,
      parent: salonCreer.parentId,
    });

    // Déplace le membre dans le nouveau salon
    await membre.voice.setChannel(nouveauSalon);

    // Stocke le salon et son propriétaire
    salonsPrives.set(nouveauSalon.id, membre.id);

    // Envoie un message dans le chat du salon vocal
    const embed = new EmbedBuilder()
      .setTitle('🎙️ Salon vocal privé')
      .setDescription(`Bienvenue **${membre.user.username}** ! Voici les commandes disponibles :`)
      .addFields(
        { name: '🔒 `!lock`', value: 'Verrouille le salon (personne ne peut rejoindre)' },
        { name: '🔓 `!unlock`', value: 'Déverrouille le salon' },
        { name: '👤 `!invite @pseudo`', value: 'Invite une personne dans le salon' },
        { name: '👢 `!kick @pseudo`', value: 'Expulse une personne du salon' },
        { name: '✏️ `!rename nouveau nom`', value: 'Renomme le salon' },
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Le salon se supprime automatiquement quand il est vide.' });

    await nouveauSalon.send({ embeds: [embed] });
  }

  // Supprime le salon quand il est vide
  if (oldState.channelId && salonsPrives.has(oldState.channelId)) {
    const salon = oldState.guild.channels.cache.get(oldState.channelId);
    if (salon && salon.members.size === 0) {
      salonsPrives.delete(salon.id);
      await salon.delete();
    }
  }
});

// ——— Commandes de gestion du salon ———
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const membre = message.member;
  const salonVocal = membre?.voice?.channel;

  // Vérifie que l'auteur est bien le propriétaire du salon
  const estProprietaire = salonVocal && salonsPrives.get(salonVocal.id) === message.author.id;

  // !lock
  if (message.content === '!lock') {
    if (!estProprietaire) return message.reply('❌ Tu n\'es pas le propriétaire de ce salon !');
    await salonVocal.permissionOverwrites.edit(message.guild.roles.everyone, {
      Connect: false
    });
    message.reply('🔒 Salon verrouillé !');
  }

  // !unlock
  if (message.content === '!unlock') {
    if (!estProprietaire) return message.reply('❌ Tu n\'es pas le propriétaire de ce salon !');
    await salonVocal.permissionOverwrites.edit(message.guild.roles.everyone, {
      Connect: true
    });
    message.reply('🔓 Salon déverrouillé !');
  }

  // !invite @pseudo
  if (message.content.startsWith('!invite')) {
    if (!estProprietaire) return message.reply('❌ Tu n\'es pas le propriétaire de ce salon !');
    const cible = message.mentions.members.first();
    if (!cible) return message.reply('❌ Mentionne un membre à inviter !');
    await salonVocal.permissionOverwrites.edit(cible, { Connect: true });
    message.reply(`✅ **${cible.user.username}** peut maintenant rejoindre le salon !`);
  }

  // !kick @pseudo
  if (message.content.startsWith('!kick')) {
    if (!estProprietaire) return message.reply('❌ Tu n\'es pas le propriétaire de ce salon !');
    const cible = message.mentions.members.first();
    if (!cible) return message.reply('❌ Mentionne un membre à expulser !');
    if (cible.voice.channelId === salonVocal.id) {
      await cible.voice.disconnect();
      message.reply(`👢 **${cible.user.username}** a été expulsé du salon !`);
    } else {
      message.reply('❌ Ce membre n\'est pas dans votre salon !');
    }
  }

  // !rename
  if (message.content.startsWith('!rename')) {
    if (!estProprietaire) return message.reply('❌ Tu n\'es pas le propriétaire de ce salon !');
    const nouveauNom = message.content.slice(8).trim();
    if (!nouveauNom) return message.reply('❌ Indique un nouveau nom !');
    await salonVocal.setName(nouveauNom);
    message.reply(`✅ Salon renommé en **${nouveauNom}** !`);
  }

  // !bonjour
  if (message.content === '!bonjour') {
    message.reply('Bonjour ! 👋');
  }
});

// ——— Messages de bienvenue et départ ———
client.on('guildMemberAdd', (member) => {
  const salon = member.guild.channels.cache.find(c => c.name === '🚪-𝑨𝒓𝒓𝒊𝒗𝒆́𝒆𝒔-𝑫𝒆́𝒑𝒂𝒓𝒕𝒔');
  if (!salon) return;

  const embed = new EmbedBuilder()
    .setTitle('🎉 Nouveau membre !')
    .setDescription(`Bienvenue **${member.user.username}** sur le serveur !\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage('URL_DE_VOTRE_IMAGE_DE_FOND')
    .setColor('#57F287')
    .setFooter({ text: `ID : ${member.user.id}` })
    .setTimestamp();

  salon.send({ embeds: [embed] });
});

client.on('guildMemberRemove', (member) => {
  const salon = member.guild.channels.cache.find(c => c.name === '🚪-𝑨𝒓𝒓𝒊𝒗𝒆́𝒆𝒔-𝑫𝒆́𝒑𝒂𝒓𝒕𝒔');
  if (!salon) return;

  const embed = new EmbedBuilder()
    .setTitle('👋 Départ')
    .setDescription(`**${member.user.username}** a quitté le serveur.\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setColor('#ED4245')
    .setFooter({ text: `ID : ${member.user.id}` })
    .setTimestamp();

  salon.send({ embeds: [embed] });
});

client.login(process.env.TOKEN_DISCORD);
