import { Guild } from 'discord.js';
import { BotEvent } from '../abstract/BotEvent';

export default class GuildCreate extends BotEvent {
    get name(): string {
        return 'guildCreate';
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
                message: `Joined guild **${guild.name}** with **${guild.memberCount}** members.`,
            }
        );
        return new Promise(() => void 1);
    }
}
