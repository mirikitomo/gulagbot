const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'pr') {
    const player = interaction.options.getString('player');
    const url = `${process.env.WEBHOOK_URL}?player=${encodeURIComponent(player)}`;

    try {
      const res = await axios.get(url);
      await interaction.reply(res.data);
    } catch (err) {
      console.error('❌ Error fetching PR:', err.message);
      await interaction.reply('❌ Could not fetch a personal record.');
    }
  }
});

client.on('messageCreate', async message => {
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.author.bot || !message.attachments.size) return;

  const attachment = message.attachments.first();
  if (!attachment.contentType || !attachment.contentType.startsWith('image/')) return;

  try {
    const payload = {
      attachments: [{ url: attachment.url }]
    };

    const response = await axios.post(process.env.WEBHOOK_URL, payload);
    console.log(`📤 Sent to script: ${response.data}`);
    message.reply(response.data);

    // 📢 Announce PR in separate channel if a new record was detected
      if (response.data.includes("kills (nuevo PR)")) {
      try {
        const announceChannel = await client.channels.fetch(process.env.ANNOUNCE_CHANNEL_ID);
        if (announceChannel) {
          await announceChannel.send(response.data);
        }
      } catch (err) {
        console.error("❌ Error announcing PR in other channel:", err.message);
      }
    }

  } catch (error) {
    console.error('❌ Error sending to Google Apps Script:', error.message);
    message.reply('❌ Failed to send image for stat tracking.');
  }
});

client.login(process.env.TOKEN);
