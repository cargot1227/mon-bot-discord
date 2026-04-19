const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration
  ]
});

const salonsPrives = new Map();
const ticketsOuverts = new Map();

// ——— Système de sanctions ———
function chargerSanctions() {
  if (!fs.existsSync('./sanctions.json')) return new Map();
  const data = JSON.parse(fs.readFileSync('./sanctions.json', 'utf8'));
  return new Map(Object.entries(data));
}

function sauvegarderSanctions() {
  const data = Object.fromEntries(sanctions);
  fs.writeFileSync('./sanctions.json', JSON.stringify(data, null, 2));
}

const sanctions = chargerSanctions();

function ajouterSanction(userId, type, raison, moderateur) {
  if (!sanctions.has(userId)) sanctions.set(userId, []);
  sanctions.get(userId).push({
    type,
    raison: raison || 'Aucune raison',
    moderateur,
    date: new Date().toLocaleString('fr-FR')
  });
  sauvegarderSanctions();
}

function parseDuree(duree) {
  const match = duree.match(/^(\d+)(m|h|j)$/);
  if (!match) return null;
  const valeur = parseInt(match[1]);
  const unite = match[2];
  if (unite === 'm') return valeur * 60 * 1000;
  if (unite === 'h') return valeur * 60 * 60 * 1000;
  if (unite === 'j') return valeur * 24 * 60 * 60 * 1000;
  return null;
}

// ——— Logs ———
async function envoyerLog(guild, embed) {
  const salonLog = guild.channels.cache.find(c => c.name === '📁log-bot');
  if (salonLog) await salonLog.send({ embeds: [embed] });
}

// ——— Setup tickets ———
async function setupTickets(guild) {
  const salonTickets = guild.channels.cache.find(c => c.name === '🎫-𝑻𝒊𝒄𝒌𝒆𝒕𝒔');
  if (!salonTickets) return;

  const embed = new EmbedBuilder()
    .setTitle('🎫 Tickets')
    .setDescription('Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\nUn salon privé sera créé pour vous.')
    .setColor('#5865F2')
    .setFooter({ text: 'Un seul ticket par personne.' });

  const bouton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('creer_ticket')
      .setLabel('📩 Ouvrir un ticket')
      .setStyle(ButtonStyle.Primary)
  );

  await salonTickets.send({ embeds: [embed], components: [bouton] });
}

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

// ——— Messages de bienvenue et départ ———
client.on('guildMemberAdd', (member) => {
  const salon = member.guild.channels.cache.get('1495108633757876294');
  if (!salon) return;

  const embed = new EmbedBuilder()
    .setTitle('🎉 Nouveau membre !')
    .setDescription(`Bienvenue **${member.user.username}** sur le serveur !\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setColor('#57F287')
    .setFooter({ text: `ID : ${member.user.id}` })
    .setTimestamp();

  salon.send({ embeds: [embed] });
});

client.on('guildMemberRemove', (member) => {
  const salon = member.guild.channels.cache.get('1495108633757876294');
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

// ——— Salons créés/supprimés/renommés ———
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

// ——— UNIQUE bloc interactionCreate ———
client.on('interactionCreate', async (interaction) => {

  // ——— Boutons tickets ———
  if (interaction.isButton() && interaction.customId === 'creer_ticket') {
    const guild = interaction.guild;
    const membre = interaction.member;

    if (ticketsOuverts.has(membre.id)) {
      return interaction.reply({
        content: `❌ Tu as déjà un ticket ouvert : <#${ticketsOuverts.get(membre.id)}>`,
        ephemeral: true
      });
    }

    const categorie = guild.channels.cache.find(c => c.name === '🎫 ASSISTANCE' && c.type === 4);
    const roleMaire = guild.roles.cache.find(r => r.name === 'Maire');
    const roleAdjoint = guild.roles.cache.find(r => r.name === 'Adjoint du maire');

    const salonTicket = await guild.channels.create({
      name: `ticket-${membre.user.username}`,
      type: 0,
      parent: categorie?.id,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: membre.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        roleMaire && { id: roleMaire.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        roleAdjoint && { id: roleAdjoint.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ].filter(Boolean),
    });

    ticketsOuverts.set(membre.id, salonTicket.id);

    const embedTicket = new EmbedBuilder()
      .setTitle('🎫 Ticket ouvert')
      .setDescription(`Bonjour **${membre.user.username}** !\nUn membre du staff va vous répondre rapidement.\n\nDécris-nous au maximum ton problème pour un traitement plus rapide.`)
      .setColor('#5865F2')
      .setTimestamp();

    const boutonsTicket = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fermer_ticket').setLabel('🔒 Fermer le ticket').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('archiver_ticket').setLabel('📁 Archiver').setStyle(ButtonStyle.Secondary),
    );

    await salonTicket.send({
      content: `${membre} | ${roleMaire || ''} ${roleAdjoint || ''}`,
      embeds: [embedTicket],
      components: [boutonsTicket]
    });

    return interaction.reply({ content: `✅ Ton ticket a été créé : <#${salonTicket.id}>`, ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'fermer_ticket') {
    const salon = interaction.channel;

    const embedFermer = new EmbedBuilder()
      .setTitle('🔒 Ticket fermé')
      .setDescription('Ce ticket va être supprimé dans **5 secondes**.\nCliquez sur 📁 Archiver pour le sauvegarder avant.')
      .setColor('#ED4245')
      .setTimestamp();

    const boutonArchiver = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('archiver_ticket').setLabel('📁 Archiver avant suppression').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embedFermer], components: [boutonArchiver] });

    setTimeout(async () => {
      for (const [userId, channelId] of ticketsOuverts.entries()) {
        if (channelId === salon.id) { ticketsOuverts.delete(userId); break; }
      }
      await salon.delete().catch(() => {});
    }, 5000);
  }

  if (interaction.isButton() && interaction.customId === 'archiver_ticket') {
    const salon = interaction.channel;
    const guild = interaction.guild;

    const salonArchives = guild.channels.cache.find(c => c.name === '📁-𝑨𝒓𝒄𝒉𝒊𝒗𝒆𝒔-𝑻𝒊𝒄𝒌𝒆𝒕𝒔');
    if (!salonArchives) return interaction.reply({ content: '❌ Salon d\'archives introuvable !', ephemeral: true });

    const messages = await salon.messages.fetch({ limit: 100 });
    const historique = messages.reverse().map(m =>
      `[${new Date(m.createdTimestamp).toLocaleString('fr-FR')}] ${m.author.tag} : ${m.content}`
    ).join('\n');

    const embedArchive = new EmbedBuilder()
      .setTitle(`📁 Archive : ${salon.name}`)
      .setDescription(`**Archivé par :** ${interaction.user.tag}\n**Date :** ${new Date().toLocaleString('fr-FR')}`)
      .setColor('#FEE75C')
      .setTimestamp();

    await salonArchives.send({ embeds: [embedArchive] });
    await salonArchives.send(`\`\`\`\n${historique.slice(0, 1900) || 'Aucun message'}\n\`\`\``);
    return interaction.reply({ content: '✅ Ticket archivé !', ephemeral: true });
  }

  // ——— Commandes slash ———
  if (!interaction.isChatInputCommand()) return;

  const membre = interaction.member;
  const salonVocal = membre?.voice?.channel;
  const estProprietaire = salonVocal && salonsPrives.get(salonVocal.id) === interaction.user.id;

  if (interaction.commandName === 'setup-tickets') {
    await setupTickets(interaction.guild);
    return interaction.reply({ content: '✅ Message de tickets envoyé !', ephemeral: true });
  }

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

  if (interaction.commandName === 'warn') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Tu n\'as pas la permission !', ephemeral: true });
    }
    const cible = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison');
    ajouterSanction(cible.id, 'warn', raison, interaction.user.tag);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Avertissement')
      .addFields(
        { name: 'Membre', value: `${cible}`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: raison },
        { name: 'Total warns', value: `${sanctions.get(cible.id).filter(s => s.type === 'warn').length}` }
      )
      .setThumbnail(cible.user.displayAvatarURL())
      .setColor('#FEE75C')
      .setTimestamp();

    await envoyerLog(interaction.guild, embed);
    await cible.send(`⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}**\nRaison : ${raison}`).catch(() => {});
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'mute') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Tu n\'as pas la permission !', ephemeral: true });
    }
    const cible = interaction.options.getMember('membre');
    const dureeStr = interaction.options.getString('duree');
    const raison = interaction.options.getString('raison') || 'Aucune raison';
    const dureeMs = parseDuree(dureeStr);

    if (!dureeMs) return interaction.reply({ content: '❌ Format invalide ! Utilise : 10m, 1h, 1j', ephemeral: true });

    await cible.timeout(dureeMs, raison);
    ajouterSanction(cible.id, 'mute', `${raison} (${dureeStr})`, interaction.user.tag);

    const embed = new EmbedBuilder()
      .setTitle('🔇 Membre mute')
      .addFields(
        { name: 'Membre', value: `${cible}`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Durée', value: dureeStr, inline: true },
        { name: 'Raison', value: raison },
      )
      .setThumbnail(cible.user.displayAvatarURL())
      .setColor('#ED4245')
      .setTimestamp();

    await envoyerLog(interaction.guild, embed);
    await cible.send(`🔇 Tu as été mute sur **${interaction.guild.name}** pendant **${dureeStr}**\nRaison : ${raison}`).catch(() => {});
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'unmute') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Tu n\'as pas la permission !', ephemeral: true });
    }
    const cible = interaction.options.getMember('membre');
    await cible.timeout(null);
    ajouterSanction(cible.id, 'unmute', 'Mute retiré', interaction.user.tag);

    const embed = new EmbedBuilder()
      .setTitle('🔊 Membre unmute')
      .addFields(
        { name: 'Membre', value: `${cible}`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
      )
      .setColor('#57F287')
      .setTimestamp();

    await envoyerLog(interaction.guild, embed);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'expulser') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: '❌ Tu n\'as pas la permission !', ephemeral: true });
    }
    const cible = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison';
    ajouterSanction(cible.id, 'kick', raison, interaction.user.tag);
    await cible.send(`👢 Tu as été expulsé de **${interaction.guild.name}**\nRaison : ${raison}`).catch(() => {});
    await cible.kick(raison);

    const embed = new EmbedBuilder()
      .setTitle('👢 Membre expulsé')
      .addFields(
        { name: 'Membre', value: cible.user.tag, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: raison },
      )
      .setThumbnail(cible.user.displayAvatarURL())
      .setColor('#ED4245')
      .setTimestamp();

    await envoyerLog(interaction.guild, embed);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'ban') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ Tu n\'as pas la permission !', ephemeral: true });
    }
    const cible = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison';
    ajouterSanction(cible.id, 'ban', raison, interaction.user.tag);
    await cible.send(`🔨 Tu as été banni de **${interaction.guild.name}**\nRaison : ${raison}`).catch(() => {});
    await cible.ban({ reason: raison });

    const embed = new EmbedBuilder()
      .setTitle('🔨 Membre banni')
      .addFields(
        { name: 'Membre', value: cible.user.tag, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: raison },
      )
      .setThumbnail(cible.user.displayAvatarURL())
      .setColor('#ED4245')
      .setTimestamp();

    await envoyerLog(interaction.guild, embed);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'unban') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ Tu n\'as pas la permission !', ephemeral: true });
    }
    const id = interaction.options.getString('id');
    await interaction.guild.members.unban(id).catch(() => {});
    ajouterSanction(id, 'unban', 'Déban', interaction.user.tag);

    const embed = new EmbedBuilder()
      .setTitle('✅ Membre débanni')
      .addFields(
        { name: 'ID', value: id, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
      )
      .setColor('#57F287')
      .setTimestamp();

    await envoyerLog(interaction.guild, embed);
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'history') {
    const cible = interaction.options.getUser('membre');
    const historique = sanctions.get(cible.id);

    if (!historique || historique.length === 0) {
      return interaction.reply({ content: `✅ **${cible.tag}** n'a aucune sanction.`, ephemeral: true });
    }

    const liste = historique.map((s, i) =>
      `**${i + 1}.** ${s.type.toUpperCase()} — ${s.raison}\n👮 ${s.moderateur} | 📅 ${s.date}`
    ).join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle(`📋 Sanctions de ${cible.tag}`)
      .setDescription(liste)
      .setThumbnail(cible.displayAvatarURL())
      .setColor('#5865F2')
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.TOKEN_DISCORD);
