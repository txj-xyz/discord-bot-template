import Bot from '../Bot';
import { readFileSync } from 'fs';
import { Message } from 'discord.js';
import { KeywordListEntry } from '../types/KeywordListEntry';

export default interface TagHandler {
    client: Bot;

    /** Input `json` file direct path string */
    file: string;

    /** List of all keywords from loaded file */
    tags: KeywordListEntry[];

    init(): KeywordListEntry[];
    reload(): KeywordListEntry[];
    get(name: string): KeywordListEntry | null;

    /**
     * Keyword command tags for Bot
     * @param message Discord `Message` object
     * @returns `Promise<void>`
     */
    check(message: Message): Promise<void>;
}

export default class TagHandler {
    constructor(client: Bot) {
        this.client = client;
        this.file = `${process.cwd()}/config/keywords.json`;
        this.tags = this.init();
    }

    public init(): KeywordListEntry[] {
        const __all = readFileSync(this.file, 'utf-8');
        const __convert = JSON.parse(__all) as KeywordListEntry[];
        this.tags = __convert;
        return __convert;
    }

    public reload(): KeywordListEntry[] {
        const __all = readFileSync(this.file, 'utf-8');
        const __convert = JSON.parse(__all) as KeywordListEntry[];
        this.tags = __convert;
        return __convert;
    }

    public get(name: string): KeywordListEntry | null {
        const __all = this.tags;
        const __filtered = __all.filter((keyword) => keyword.keywords.join(' ').includes(name));
        const __result = __filtered.length !== 0 ? __filtered[0] : null;
        return __result;
    }

    public async check(message: Message): Promise<void> {
        for await (const filter of this.tags) {
            let hasKeyWord = false;
            if (!filter.enabled) break;

            if (filter.match_type === 'any') {
                hasKeyWord = filter.keywords.some((word) => message.content.toLowerCase().includes(word.toLowerCase()));
            } else if (filter.match_type === 'exact') {
                hasKeyWord = filter.keywords.some((word) => message.content.toLowerCase() === word.toLowerCase());
            }
            if (hasKeyWord) {
                if (filter.reply_type === 'react') return void (await message.react(filter.reply));
                const msg = filter.reply_type
                    ? filter.reply_type === 'direct'
                        ? await message.reply(filter.reply)
                        : await message.channel.send(filter.reply)
                    : await message.channel.send(filter.reply);
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                filter.delete_after ? setTimeout(async () => await msg.delete(), filter.delete_after * 1000) : void 0;
            }
        }
    }
}
