
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';
import dotenv from 'dotenv';
import os from 'os';
import { keep_alive } from './keep_alive.js';

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

console.log(`Running on system user: ${os.userInfo().username}`);
console.log(`Home directory: ${os.homedir()}`);

keep_alive();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('globalban')
    .setDescription('Globally bans a user from all servers.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for ban').setRequired(true)),
  new SlashCommandBuilder()
    .setName('globalkick')
    .setDescription('Globally kicks a user from all servers.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for kick').setRequired(true)),
  new SlashCommandBuilder()
    .setName('globalunban')
    .setDescription('Globally unbans a user from all servers.')
    .addStringOption(opt =>
      opt.setName('userid').setDescription('User ID to unban').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('❌ Error registering commands:', err);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const staff = interaction.user;
  await interaction.deferReply();

  const hasBanPermission = guild => guild.members.me.permissions.has('BanMembers');
  const hasKickPermission = guild => guild.members.me.permissions.has('KickMembers');
  const hasManageGuildPermission = guild => guild.members.me.permissions.has('ManageGuild');
  const hasStaffBanPermission = guild => guild.members.cache.get(staff.id)?.permissions.has('BanMembers');
  const hasStaffKickPermission = guild => guild.members.cache.get(staff.id)?.permissions.has('KickMembers');

  if (interaction.commandName === 'globalban') {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    let success = 0;

    for (const [, guild] of client.guilds.cache) {
      if (!hasBanPermission(guild) || !hasStaffBanPermission(guild)) continue;
      try {
        await guild.members.ban(target.id, { reason });
        success++;
      } catch (err) { console.error(err); }
    }

    const embed = new EmbedBuilder()
      .setColor(0xff1a1a)
      .setTitle('🚫 **Globally Banned**')
      .setDescription(`**${staff.tag}** has globally banned <@${target.id}> in **${success}** server(s).`)
      .addFields(
        { name: 'Username', value: target.username, inline: true },
        { name: 'User ID', value: target.id, inline: true },
        { name: 'Staff Member', value: `${staff.tag} (${staff.id})`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setFooter({ text: 'Tennessee State Roleplay' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  if (interaction.commandName === 'globalkick') {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    let success = 0;

    for (const [, guild] of client.guilds.cache) {
      if (!hasKickPermission(guild) || !hasStaffKickPermission(guild)) continue;
      try {
        const member = await guild.members.fetch(target.id);
        if (member) {
          await member.kick(reason);
          success++;
        }
      } catch (err) { console.error(err); }
    }

    const embed = new EmbedBuilder()
      .setColor(0xff7f00)
      .setTitle('👢 **Globally Kicked**')
      .setDescription(`**${staff.tag}** has globally kicked <@${target.id}> in **${success}** server(s).`)
      .addFields(
        { name: 'Username', value: target.username, inline: true },
        { name: 'User ID', value: target.id, inline: true },
        { name: 'Staff Member', value: `${staff.tag} (${staff.id})`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setFooter({ text: 'Tennessee State Roleplay' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  if (interaction.commandName === 'globalunban') {
    const userId = interaction.options.getString('userid');
    let success = 0;

    for (const [, guild] of client.guilds.cache) {
      if (!hasManageGuildPermission(guild)) continue;
      try {
        await guild.bans.remove(userId);
        success++;
      } catch (err) { console.error(err); }
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('✅ **Globally Unbanned**')
      .setDescription(`**${staff.tag}** has globally unbanned <@${userId}> in **${success}** server(s).`)
      .addFields(
        { name: 'User ID', value: userId, inline: true },
        { name: 'Staff Member', value: `${staff.tag} (${staff.id})`, inline: true }
      )
      .setFooter({ text: 'Tennessee State Roleplay' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
