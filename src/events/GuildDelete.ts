import { Guild } from 'discord.js';
import { BotEvent } from '../abstract/BotEvent';

export default class GuildDelete extends BotEvent {
    get name(): string {
        return 'guildDelete';
    }

    get fireOnce(): boolean {
        return false;
    }

    get enabled(): boolean {
        return true;
    }

    async run([guild]: [Guild]): Promise<void> {
        console.log(
            {
                handler: this.constructor.name,
                message: `Left guild **${guild.name}** with **${guild.memberCount}** members.`,
            }
        );
        return new Promise(() => void 1);
    }
}