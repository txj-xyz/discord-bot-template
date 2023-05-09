import { Dirent, readdirSync } from 'fs';
import Bot from '../Bot';
import { BotEvent } from '../abstract/BotEvent';

export default interface EventHandler {
    client: Bot;
    built: boolean;
}
export default class EventHandler {

    constructor(client: Bot) {
        this.client = client;
        this.built = false;
        client.on('debug', (message) => { !client.production && console.log('DEBUG DISCORD.JS', message )})
        client.on('shardDisconnect', (_event, id) => { this.client.logger.info({ message: `Shard ${id} Shard Disconnecting`, handler: this.constructor.name }) });
        client.on('shardResumed', (id: string) => { this.client.logger.info({ message: `Shard ${id} Shard Resume`, handler: this.constructor.name }) });
        client.on('shardReady', (id) => { this.client.logger.info({ message: `Shard ${id} | Shard Ready`, handler: this.constructor.name, uid: `Internal Cluster` }) });
    }

    async build(): Promise<this> {
        if (this.built) return this;
        const events = readdirSync(`${this.client.location}/src/events`, { withFileTypes: true })
            .filter((file) => file.name.endsWith('.ts') && file.name !== 'index.ts');
        const promises = events.map(async (eventName: Dirent) => {
            const { default: IBotEvent } = await import(`${this.client.location}/src/events/${eventName.name}`).catch(err => this.client.emit('error', err as Error)) as { default: BotEvent };
            try {
                const __IBotEvent = new IBotEvent(this.client);
                if (!__IBotEvent.enabled) return;
                __IBotEvent.fireOnce ? this.client.once(__IBotEvent.name, __IBotEvent.exec.bind(__IBotEvent)) : this.client.on(__IBotEvent.name, __IBotEvent.exec.bind(__IBotEvent));
                !this.client.production ? this.client.logger.warn({ handler: this.constructor.name, message: `Loaded ${__IBotEvent.name} event.` }) : void 0;
            } catch { return; }
        });

        await Promise.all(promises);
        const loaded = promises.filter(p => p !== undefined).length;
        this.client.logger.info({ handler: this.constructor.name, message: `Loaded ${loaded}/${events.length} client event(s)` });
        this.built = true;
        return this;
    }
}