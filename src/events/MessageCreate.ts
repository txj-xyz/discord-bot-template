import { Message } from 'discord.js';
import { BotEvent } from '../abstract/BotEvent';

export default class MessageCreate extends BotEvent {

    get name(): string {
        return 'messageCreate';
    }

    get fireOnce(): boolean {
        return false;
    }

    get enabled(): boolean {
        return true;
    }

    async run([message]: [Message]): Promise<void | Message<true>> {
        if (message.author.bot) return;
        if (!message.inGuild()) return;

        if (message.mentions.users.first()?.id == this.client.user?.id && this.client.util.config.owners.includes(message.author.id) && message.content.includes(`build`)) {
            return await this.client.util.slashCommandBuilder(message);
        }

        // Ban list handling (I need to make a new method that will just check all versions of a blacklist ) (TODO)
        const { guildId, author: { id: userId }, channelId } = message;
        if (this.client.blacklist.isBlacklisted('guild', guildId)) return void !0;
        if (this.client.blacklist.isBlacklisted('user', userId)) return void !0;
        if (this.client.blacklist.isBlacklisted('channel', channelId)) return void !0;
        if (this.client.blacklist.isBlacklisted('all', userId) ||
            this.client.blacklist.isBlacklisted('all', guildId) ||
            (channelId && this.client.blacklist.isBlacklisted('all', channelId))
        ) {
            return void !0
        };

        // ------------------------------------
        // Safely assign commands after this line
        // ------------------------------------
    }
}
