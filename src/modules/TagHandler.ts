import Bot from '../Bot';
import { readFileSync } from 'fs';
import { Message } from 'discord.js';

export type KeywordListEntry = {
    /**
     * Whether the keyword is enabled or not.
     */
    enabled: boolean;

    /**
     * The words in messages to look for. This can be anything matching a string.
     */
    keywords: string[];

    /**
     * This is a `string` reply from the bot once they `keywords` is matched.
     */
    reply: string;

    /**
     * An optional `number` that can be specified to remove the bot `reply` after a certain period of time in `seconds`.
     */
    delete_after?: number;

    /**
     * `any` = must be in the message content
     * 
     * `exact` = must be exact message content match
     */
    match_type: 'any' | 'exact';

    /**
     * `direct` = reply to the user
     * 
     * `channel` = reply in the matched channel
     * 
     * `react` = react to the message with an emoji (Must be snowflake)
     */
    reply_type?: 'direct' | 'channel' | 'react'
}

export default interface TagHandler {
    client: Bot;

    /** Input `json` file direct path string */
    file: string;

    /** List of all keywords from loaded file */
    tags: KeywordListEntry[]
    
    init(): KeywordListEntry[]
    reload(): KeywordListEntry[];
    get(name: string): KeywordListEntry | null

    /**
     * Keyword command tags for Bot
     * @param message Discord `Message` object
     * @returns `Promise<void>`
     */
    check(message: Message): Promise<void>
}

export default class TagHandler {
    constructor(client: Bot) {
        this.client = client;
        this.file = `${process.cwd()}/config/keywords.json`
        this.tags = this.init();
    }
    
    public init(): KeywordListEntry[] {
        const __all = readFileSync(this.file, 'utf-8')
        const __convert = JSON.parse(__all) as KeywordListEntry[]
        this.tags = __convert;
        return __convert;
    }

    public reload(): KeywordListEntry[] {
        const __all = readFileSync(this.file, 'utf-8')
        const __convert = JSON.parse(__all) as KeywordListEntry[]
        this.tags = __convert;
        return __convert;
    }

    public get(name: string): KeywordListEntry | null {
        const __all = this.tags;
        const __filtered = __all.filter(keyword => keyword.keywords.join(' ').includes(name))
        const __result = __filtered.length !== 0 ? __filtered[0] : null;
        return __result
    }

    public async check(message: Message): Promise<void> {
        for await (const filter of this.tags) {
            let hasKeyWord = false;
            if (!filter.enabled) break;

            if (filter.match_type === 'any') {
                hasKeyWord = filter.keywords.some((word) => message.content.toLowerCase().includes(word.toLowerCase()));
            }
            else if (filter.match_type === 'exact') {
                hasKeyWord = filter.keywords.some((word) => message.content.toLowerCase() === word.toLowerCase());
            }
            if (hasKeyWord) {

                if (filter.reply_type === 'react') return void await message.react(filter.reply)
                const msg = filter.reply_type ? filter.reply_type === 'direct' ? await message.reply(filter.reply) : await message.channel.send(filter.reply) : await message.channel.send(filter.reply);
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                filter.delete_after ? setTimeout(async () => await msg.delete(), filter.delete_after * 1000) : void 0;
            }
        }
    }
}
