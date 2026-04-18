const { Client, GatewayIntentBits, EmbedBuilder, ChannelType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
    GatewayIntentBits.GuildModeration
  ]
});

const salonsPrives = new Map();

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// ——— Création automatique du salon vocal ———
client.on('voiceStateUpdate', async (oldState, newState) => {
  const salonCreer = newState.guild.channels.cache.find(c => c.name === '➕-Créer-un-Salon');

  if (newState.channelId === salonCreer?.id) {
    const membre = newState.member;

    const nouveauSalon = await newState.guild.channels.create({
      name: `🔊 ${membre.user.username}`,
      type: ChannelType.GuildVoice,
      parent: salonCreer.parentId,
    });

    await membre.voice.setChannel(nouveauSalon);
    salonsPrives.set(nouveauSalon.id, membre.id);

    const embed = new EmbedBuilder()
      .setTitle('🎙️ Salon vocal privé')
      .setDescription(`Bienvenue **${membre.user.username}** ! Voici les commandes disponibles :`)
      .addFields(
        { name: '🔒 `/lock`', value: 'Verrouille le salon' },
        { name: '🔓 `/unlock`', value: 'Déverrouille le salon' },
        { name: '👤 `/invite @pseudo`', value: 'Invite une personne' },
        { name: '👢 `/kick @pseudo`', value: 'Expulse une personne' },
        { name: '✏️ `/rename nouveau nom`', value: 'Renomme le salon' },
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Le salon se supprime automatiquement quand il est vide.' });

    await nouveauSalon.send({ embeds: [embed] });
  }

  if (oldState.channelId && salonsPrives.has(oldState.channelId)) {
    const salon = oldState.guild.channels.cache.get(oldState.channelId);
    if (salon && salon.members.size === 0) {
      salonsPrives.delete(salon.id);
      await salon.delete();
    }
  }
});

// ——— Commandes slash ———
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const membre = interaction.member;
  const salonVocal = membre?.voice?.channel;
  const estProprietaire = salonVocal && salonsPrives.get(salonVocal.id) === interaction.user.id;

  if (interaction.commandName === 'bonjour') {
    return interaction.reply('Bonjour ! 👋');
  }

  if (interaction.commandName === 'lock') {
    if (!estProprietaire) return interaction.reply({ content: '❌ Tu n\'es pas le propriétaire de ce salon !', ephemeral: true });
    await salonVocal.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
    return interaction.reply('🔒 Salon verrouillé !');
  }

  if (interaction.commandName === 'unlock') {
    if (!estProprietaire) return interaction.reply({ content: '❌ Tu n\'es pas le propriétaire de ce salon !', ephemeral: true });
    await salonVocal.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
    return interaction.reply('🔓 Salon déverrouillé !');
  }

  if (interaction.commandName === 'invite') {
    if (!estProprietaire) return interaction.reply({ content: '❌ Tu n\'es pas le propriétaire de ce salon !', ephemeral: true });
    const cible = interaction.options.getMember('membre');
    await salonVocal.permissionOverwrites.edit(cible, { Connect: true });
    return interaction.reply(`✅ **${cible.user.username}** peut maintenant rejoindre le salon !`);
  }

  if (interaction.commandName === 'kick') {
    if (!estProprietaire) return interaction.reply({ content: '❌ Tu n\'es pas le propriétaire de ce salon !', ephemeral: true });
    const cible = interaction.options.getMember('membre');
    if (cible.voice.channelId === salonVocal.id) {
      await cible.voice.disconnect();
      return interaction.reply(`👢 **${cible.user.username}** a été expulsé !`);
    }
    return interaction.reply({ content: '❌ Ce membre n\'est pas dans votre salon !', ephemeral: true });
  }

  if (interaction.commandName === 'rename') {
    if (!estProprietaire) return interaction.reply({ content: '❌ Tu n\'es pas le propriétaire de ce salon !', ephemeral: true });
    const nouveauNom = interaction.options.getString('nom');
    await salonVocal.setName(nouveauNom);
    return interaction.reply(`✅ Salon renommé en **${nouveauNom}** !`);
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

// ——— Fonction utilitaire pour envoyer les logs ———
async function envoyerLog(guild, embed) {
  const salonLog = guild.channels.cache.find(c => c.name === '📁log-bot');
  if (salonLog) await salonLog.send({ embeds: [embed] });
}

// ——— Messages modifiés ———
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.content || oldMessage.content === newMessage.content) return;
  if (oldMessage.author?.bot) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Message modifié')
    .addFields(
      { name: 'Auteur', value: `${oldMessage.author}`, inline: true },
      { name: 'Salon', value: `${oldMessage.channel}`, inline: true },
      { name: 'Avant', value: oldMessage.content || 'Inconnu' },
      { name: 'Après', value: newMessage.content || 'Inconnu' },
    )
    .setColor('#FEE75C')
    .setTimestamp();

  await envoyerLog(oldMessage.guild, embed);
});

// ——— Messages supprimés ———
client.on('messageDelete', async (message) => {
  if (message.author?.bot) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message supprimé')
    .addFields(
      { name: 'Auteur', value: `${message.author}`, inline: true },
      { name: 'Salon', value: `${message.channel}`, inline: true },
      { name: 'Contenu', value: message.content || 'Inconnu (message trop ancien)' },
    )
    .setColor('#ED4245')
    .setTimestamp();

  await envoyerLog(message.guild, embed);
});

// ——— Bans ———
client.on('guildBanAdd', async (ban) => {
  const embed = new EmbedBuilder()
    .setTitle('🔨 Membre banni')
    .addFields(
      { name: 'Membre', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Raison', value: ban.reason || 'Aucune raison fournie' },
    )
    .setThumbnail(ban.user.displayAvatarURL())
    .setColor('#ED4245')
    .setTimestamp();

  await envoyerLog(ban.guild, embed);
});

// ——— Débans ———
client.on('guildBanRemove', async (ban) => {
  const embed = new EmbedBuilder()
    .setTitle('✅ Membre débanni')
    .addFields(
      { name: 'Membre', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
    )
    .setThumbnail(ban.user.displayAvatarURL())
    .setColor('#57F287')
    .setTimestamp();

  await envoyerLog(ban.guild, embed);
});

// ——— Changements de rôles ———
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const rolesAjoutes = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const rolesSupprime = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

  if (rolesAjoutes.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('👑 Rôle ajouté')
      .addFields(
        { name: 'Membre', value: `${newMember}`, inline: true },
        { name: 'Rôle ajouté', value: rolesAjoutes.map(r => r.name).join(', '), inline: true },
      )
      .setColor('#57F287')
      .setTimestamp();

    await envoyerLog(newMember.guild, embed);
  }

  if (rolesSupprime.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('👑 Rôle retiré')
      .addFields(
        { name: 'Membre', value: `${newMember}`, inline: true },
        { name: 'Rôle retiré', value: rolesSupprime.map(r => r.name).join(', '), inline: true },
      )
      .setColor('#ED4245')
      .setTimestamp();

    await envoyerLog(newMember.guild, embed);
  }
});

// ——— Salons créés ———
client.on('channelCreate', async (channel) => {
  const embed = new EmbedBuilder()
    .setTitle('📂 Salon créé')
    .addFields(
      { name: 'Nom', value: channel.name, inline: true },
      { name: 'Type', value: channel.type.toString(), inline: true },
    )
    .setColor('#57F287')
    .setTimestamp();

  await envoyerLog(channel.guild, embed);
});

// ——— Salons supprimés ———
client.on('channelDelete', async (channel) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Salon supprimé')
    .addFields(
      { name: 'Nom', value: channel.name, inline: true },
      { name: 'Type', value: channel.type.toString(), inline: true },
    )
    .setColor('#ED4245')
    .setTimestamp();

  await envoyerLog(channel.guild, embed);
});

// ——— Salons renommés ———
client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (oldChannel.name === newChannel.name) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Salon renommé')
    .addFields(
      { name: 'Avant', value: oldChannel.name, inline: true },
      { name: 'Après', value: newChannel.name, inline: true },
    )
    .setColor('#FEE75C')
    .setTimestamp();

  await envoyerLog(newChannel.guild, embed);
});

client.login(process.env.TOKEN_DISCORD);
