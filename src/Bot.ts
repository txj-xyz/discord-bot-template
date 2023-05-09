import 'dotenv/config';
import { Client, ClientOptions, Collection, WebhookClient } from 'discord.js';
import InteractionHandler from './modules/InteractionHandler';
import EventHandler from './modules/EventHandler';
import UtilityHandler from './modules/UtilityHandler';
import BotLogger from './modules/LoggingHandler';
import { webhookUrl } from '../config/config.json'

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
     * Non-blocking client logger
     * Uses `Winston`
     * @returns @typeof `Winston.Logger & BotLogger`
     */
    logger: BotLogger;

    /**
     * Webhooks is a collection of Webhook clients by name you can use
     * directly if you need to send logs somewhere
     * @returns `Collection<string, WebhookClient>`
     */
    webhooks: Collection<string, WebhookClient>

}

/**
 * The main Bot class, exposing all functionality.
 */
export default class Bot extends Client {
    constructor(options: ClientOptions) {
        super(options);
        this.webhooks = new Collection<string, WebhookClient>();
        this.webhooks.set('discord-logs', new WebhookClient({ url: webhookUrl }));
        this.logger = new BotLogger(this).c as BotLogger;
        this.production = process.env.DEV_MODE ? false : true;
        this.color = 0x7e686c;
        this.util = new UtilityHandler(this);
        this.quitting = false;
        this.location = process.cwd();
        this.interactions = new InteractionHandler(this);
        this.events = new EventHandler(this);
        process.on('unhandledRejection', (err: unknown) => { return this.logger.error({ message: `UnhandledRejection from Process`, error: (err as Error).stack }) });
    }

    async login(): Promise<string> {
        await this.events.build();
        await this.interactions.build();
        await super.login(this.production ? process.env.TOKEN : process.env.TOKEN_DEV);
        return this.constructor.name;
    }
}