import 'dotenv/config';
import { Client, ClientOptions, Collection, WebhookClient } from 'discord.js';
import InteractionHandler from './modules/InteractionHandler';
import EventHandler from './modules/EventHandler';
import UtilityHandler from './modules/UtilityHandler';
import BlacklistHandler from './handlers/BlacklistHandler';
// import { webhookUrl } from '../config/config.json'
import { ConfigMap } from './modules/ConfigMap';

export default interface Bot extends Client {
    
    /**
     * Check whether the bot is running in production mode or development
     * @returns `boolean`
     */
    production: boolean;

    /**
     * Client color in hex for embeds etc
     * @returns `number`
     */
    color: number;

    /**
     * Utilities for the client to have open access to at any time.
     * @returns `UtilityHandler`
     */
    util: UtilityHandler;

    /**
     * Simple quitting state flag.
     */
    quitting: boolean;

    /**
     * Present bot working directory.
     */
    location: string;

    /**
     * Handler for Interactions coming from Slash Commands.
     */
    interactions: InteractionHandler;

    /**
     * Handler for incoming Bot Events.
     */
    events: EventHandler;

    /**
     * Internal bot Blacklist, handles not responding to banned users.
     * @returns `BanData[]`
     */
    blacklist: BlacklistHandler;

    /**
     * Webhooks is a collection of Webhook clients by name you can use
     * directly if you need to send logs somewhere
     * @returns `Collection<string, WebhookClient>`
     */
    webhooks: Collection<string, WebhookClient>

    /**
     * Configuration map live updating to check if a feature is enabled
     */
    configmap: ConfigMap
}

/**
 * The main Bot class, exposing all functionality.
 */
export default class Bot extends Client {
    constructor(options: ClientOptions) {
        super(options);
        this.configmap = new ConfigMap('./config/feature_toggle.json')
        this.webhooks = new Collection<string, WebhookClient>();
        this.production = process.env.DEV_MODE ? false : true;
        this.color = 0x7e686c;
        this.util = new UtilityHandler(this);
        this.quitting = false;
        this.location = process.cwd().replace(/\\/gim, "/");
        this.interactions = new InteractionHandler(this);
        this.events = new EventHandler(this);
        this.blacklist = new BlacklistHandler(this);
        process.on('unhandledRejection', (err: unknown) => { return console.error({ message: `unhandledRejection from Process`, error: err }) });
        process.on('uncaughtException', (err: unknown) => { return console.error({ message: `uncaughtException from Process`, error: err }) });
    }

    async login(): Promise<string> {
        await this.events.build();
        await this.interactions.build();
        await super.login(this.production ? process.env.TOKEN : process.env.TOKEN_DEV);
        return this.constructor.name;
    }
}