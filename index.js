'use strict';

// Require the necessary discord.js classes
const {Client, Events, GatewayIntentBits} = require('discord.js');
require('dotenv').config();
const cron = require('node-cron');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// In-memory array to store blacklisted codes
const blacklistedCodes = [];
const phoneCodes = [];
const generateRandomCode = () => {
    const number = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    if (blacklistedCodes.includes(number)) {
        console.log(`Blacklisted code: ${number}`);
        return generateRandomCode();
    }

    if (phoneCodes.includes(number)) {
        console.log(`Duplicate code: ${number}`);
        return generateRandomCode();
    }

    return number;
};

let phoneCode = generateRandomCode();

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    cron.schedule('0 7 * * *', () => {
        phoneCode = generateRandomCode();
        phoneCodes.push(phoneCode);
        console.log(`New phone code: ${phoneCode}`);

        const channel = c.channels.cache.get(process.env.CHANNEL_ID);

        if (channel.isTextBased()) {
            channel.send(`🔄 Phone code has been refreshed: ${phoneCode}`);
        }
    });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!refreshcode') {
        phoneCode = generateRandomCode();
        phoneCodes.push(phoneCode);

        await message.channel.send(`🔄 Phone code has been manually refreshed: ${phoneCode}`);
    } else if (message.content.toLowerCase().startsWith('!blacklist')) {
        const args = message.content.split(' ');

        if (args.length !== 2 || args[1].length !== 4 || isNaN(args[1])) {
            await message.channel.send('❌ Invalid format. Use !blacklist [4-digit-code]');
            return;
        }

        const blacklistedCode = args[1];
        blacklistedCodes.push(blacklistedCode);
        await message.channel.send(`✅ Blacklisted code: ${blacklistedCode}`);
    }
})

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
