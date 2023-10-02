
import { Interaction } from 'discord.js';
import Bot from '../Bot';
import { readFileSync, writeFileSync } from 'fs';

export type BlacklistType = 'user' | 'guild' | 'channel' | 'all'

export type BanData = {
    type: BlacklistType,
    id: string,
}

export default interface BlacklistHandler {
    client: Bot;
    file: string;
    banlist: Array<BanData>;

    /**
     * Built in Blacklist query
     * @param type `BlacklistType` User, Guild or Channel Type to search for
     * @param query `string` the ID of the ban to look for (typically the type's ID)
     * @returns `boolean` true if found, false if not found
     */
    isBlacklisted(type: BlacklistType, query: string): boolean;

    /**
     * Load up the Blacklist file, can be called any time.
     * @returns `BanData[]`
     */
    init(): Array<BanData>;
}

export default class BlacklistHandler {
    constructor(client: Bot) {
        this.client = client;
        this.file = `${process.cwd()}/config/ban_list.json`
        this.banlist = []
        //Load up the ban list now
        this.init()
    }

    public get(query: string): BanData | null {
        const __banlist = this.banlist;
        const __filterResult = __banlist.filter(b => b.id === query);
        return __filterResult.shift() || null;
    }

    public add(type: BlacklistType, query: string): BanData | null {
        this.banlist.push({ type, id: query })
        const isWrote = this.write();
        return isWrote ? { type, id: query } : null
    }

    public delete(query: string): BanData | null {
        const __beforeList = this.banlist;
        const __removedEntry = this.banlist.filter(b => b.id !== query);
        const __isFound = __beforeList.length !== __removedEntry.length;
        const __foundRecord = __beforeList.filter(b => b.id === query);
        __removedEntry.length ? this.banlist = __removedEntry : void !0
        const isWrote = this.write();
        return __isFound && isWrote ? __foundRecord.shift() || null : null
    }

    
    public isBlacklisted(type: BlacklistType, query: string): boolean {
        const __banlist = this.banlist;
        if (type === 'all') {
            const __checkAll = __banlist.some(b => b.id === query);
            return __checkAll;
        }
        const __typeFilter = __banlist.filter(b => b.type === type);
        const __result = __typeFilter.some(b => b.id === query)
        return __result;
    }

    public init(): BanData[] {
        const __all = readFileSync(this.file, 'utf-8')
        const __convert = JSON.parse(__all) as BanData[]
        this.banlist = __convert;
        return __convert;
    }

    public write(): boolean {
        try {
            const __banData = JSON.stringify(this.banlist, null, 2);
            writeFileSync(this.file, __banData, 'utf-8');
            return true;
        } catch (error) {
            return false;
        }
    }

    public checkInteractionAll(interaction: Interaction, data:
        {
            userId: string;
            guildId: string;
            channelId: string;
        }
    ): boolean {
        const { uniBanResponse, guildBanResonse, userBanResponse, channelBanResponse } = this.client.util.config.modules.blacklistManager
        if (!interaction.isRepliable()) return false
        if (this.isBlacklisted('guild', data.guildId)) {
            interaction.reply({ content: guildBanResonse, ephemeral: true }).catch(() => false)
            return true;
        };
        if (this.isBlacklisted('user', data.userId)) {
            interaction.reply({ content: userBanResponse, ephemeral: true }).catch(() => false)
            return true;
        };
        if (data.channelId && this.isBlacklisted('channel', data.channelId)) {
            interaction.reply({ content: channelBanResponse, ephemeral: true }).catch(() => false)
            return true;
        };
        if (this.isBlacklisted('all', data.userId) || this.isBlacklisted('all', data.guildId) || (data.channelId && this.isBlacklisted('all', data.channelId))) {
            interaction.reply({ content: uniBanResponse, ephemeral: true }).catch(() => false)
            return true;
        };
        return false;
    }
}
