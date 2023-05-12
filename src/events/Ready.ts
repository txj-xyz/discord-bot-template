import { BotEvent } from '../abstract/BotEvent';

export default class Ready extends BotEvent {
    get name(): string {
        return 'ready';
    }

    get fireOnce(): boolean {
        return true;
    }

    get enabled(): boolean {
        return true;
    }

    async run(): Promise<void> {
        console.log('Bot is ready', this.client.user?.username as string);
    }
}
