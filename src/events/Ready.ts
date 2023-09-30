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

    private get statuses(): string[] {
        return this.client.util.config.statuses;
    }

    async run(): Promise<void> {
        if (!this.client.isReady()) return;
        // Set bot status
        console.log({ message: `[${this.client.user.username}] Ready! Serving ${this.client.guilds.cache.size} guild(s) with ${this.client.users.cache.size} user(s)` });
        this.client.user?.setActivity(`with guides.`);

        // Every 300 seconds rotate out the status with something in `this.statuses[]`
        setInterval((): void => {
            const current = this.statuses.shift() ?? '';
            this.client.isReady() ? this.client.user.setActivity(current) : void 0;
            this.statuses.push(current);
        }, 300000);

        // Setup the TempVC channels
        try {
            if (!this.client.configmap.check('TEMP_VOICE_CHANNELS_MODULE') && !this.client.production) return void 1;
            this.client.util.tempvcmanager.registerChannelListener(
                this.client.util.config.modules.tempVCHandler.channelID,
                this.client.util.config.modules.tempVCHandler.categoryID
            )
        } catch (error) {
            throw new Error((error as Error).message)
        }

        // Attempt to start cron jobs and fetch guides if in production
        try {
            // if (!this.client.production) return void 1;
            return void 0;
        } catch (error) {
            throw new Error((error as Error).message)
        }
    }
}
