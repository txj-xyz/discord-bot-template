import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { Indomitable, IndomitableOptions } from 'indomitable';
import Bot from './src/Bot';

if (!process.env.TOKEN) throw new Error('Token Missing');

const {
    Guilds,
    GuildMembers,
    GuildVoiceStates,
    GuildMessages,
    GuildMessageReactions,
    MessageContent,
    GuildPresences
} = GatewayIntentBits;

const clientOptions = {
    intents: [
        Guilds,
        GuildMembers,
        GuildMessages,
        GuildMessageReactions,
        MessageContent,
        GuildVoiceStates,
        GuildPresences
    ],
}

if (process.env.NO_SHARDING) {
    const bot = new Bot(clientOptions);
    void bot.login().catch(void 0)
} else {
    const sharderOptions: IndomitableOptions = {
        clientOptions,
        client: Bot as typeof Client,
        autoRestart: true,
        token: process.env.TOKEN ?? ''
    };

    const manager = new Indomitable(sharderOptions)
        .on('error', e => console.error('[ERROR MAIN] [ClusterHandler]', e))
        .on('debug', (message) => { console.log(`[ClusterHandler] [Main] ${message}`) });
    void manager.spawn()
}