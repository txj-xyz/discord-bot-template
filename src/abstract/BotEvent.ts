import { EventEmitter } from 'node:events';
import Bot from '../Bot';
import { ClientEvents } from 'discord.js';

export interface BotEvent extends EventEmitter {
    new(client: Bot): this
    uid: string;
    client: Bot;
    get cmdName(): string;
    get fireOnce(): boolean;
    get enabled(): boolean;
    exec(...args: ClientEvents[] | unknown[]): void | unknown
    run(...args: ClientEvents[] | unknown[]): Promise<void | unknown>
}

export class BotEvent extends EventEmitter {
    constructor(client: Bot) {
        super();
        this.client = client;
    }

    exec(...args: ClientEvents[] | unknown[]): void {
        void this.run(args)
    }
}
