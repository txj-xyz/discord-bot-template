import * as config from '../../config/config.json';
import { EmbedBuilder, Message, GuildMember, Interaction } from 'discord.js';
import Bot from '../Bot';
import { readFileSync } from 'fs';

export default interface UtilityHandler {
    client: Bot;
    config: typeof config;
    random(array: Array<unknown>): Array<number>;
    loadingEmbed: EmbedBuilder;
    loadingText: string;
    slashCommandModule(message: Message<true>): Promise<void | Message<true>>;
}
export default class UtilityHandler {
    constructor(client: Bot) {
        this.client = client;
        this.config = config;
        this.random = (array): number[] => array[Math.floor(Math.random() * array.length)] as number[];
        this.loadingEmbed = new EmbedBuilder().setAuthor({ name: '<a:Typing:598682375303593985> **Loading...**' });
        this.loadingText = '<a:Typing:598682375303593985> **Loading...**';
    }

    public reloadConfig(): boolean {
        try {
            const __config = readFileSync('../../config/config.json', 'utf-8')
            const __convert = JSON.parse(__config) as typeof config
            this.config = __convert;
            return true;
        } catch {
            return false;
        }
    }
    
    public checkPermissions(type: 'name' | 'id', member: GuildMember | Interaction, role: string[]): boolean {
        if (this.client.util.config.owners.includes(member.user.id)) return true;
        if (member instanceof GuildMember) {
            const __checkAllRoles: boolean[] = role.map((role) => member.roles.cache.some((r) => type === 'name' ? r.name === role : r.id === role));
            const _containsRole: boolean = __checkAllRoles.some((role) => role === true);
            return _containsRole;
        } else {
            const m = member.member as GuildMember;
            const __checkAllRoles: boolean[] = role.map((role) => m.roles.cache.some((r) => type === 'name' ? r.name === role : r.id === role));
            const _containsRole: boolean = __checkAllRoles.some((role) => role === true);
            return _containsRole;
        }
    }
}
