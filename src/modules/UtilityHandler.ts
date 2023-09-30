import * as config from '../../config/config.json';
import { EmbedBuilder, ChatInputCommandInteraction, Message, SlashCommandBuilder, ChannelType, GuildMember, Collection, ThreadChannel, Interaction, ApplicationCommand, ApplicationCommandData, codeBlock } from 'discord.js';
import Bot from '../Bot';
import { readFileSync, readdirSync } from 'fs';
import { BotInteraction } from '../abstract/BotInteraction';
import TagHandler from './TagHandler';
import TempChannelManager from './TempVCHandler';

export default interface UtilityHandler {
    client: Bot;
    config: typeof config;
    random(array: Array<unknown>): Array<number>;
    loadingEmbed: EmbedBuilder;
    loadingText: string;
    tagManager: TagHandler;
    tempvcmanager: TempChannelManager;
    slashCommandBuilder(message: Message<true>): Promise<void | Message<true>>;
    checkGuidesForums(message: Message<true>): Promise<Message<true> | undefined>;
    jagexPingCheck(message: Message<true>): Promise<void>;
    deleteMessage(interaction: ChatInputCommandInteraction, id: string): Promise<Message<true>> | undefined;
    removeArrayIndex(array: Array<unknown>, indexID: number): unknown[];
    checkURL(string: string): boolean;
    trim(string: string, max: number): string;
    convertMS(ms: number | null): string;
    convertBytes(bytes: number): string;
    sleep(ms: number): Promise<unknown>;
    splitMessage(str: string, size: number): string[]
}
export default class UtilityHandler {
    constructor(client: Bot) {
        this.client = client;
        this.config = config;
        this.random = (array): number[] => array[Math.floor(Math.random() * array.length)] as number[];
        this.loadingEmbed = new EmbedBuilder().setAuthor({ name: '<a:Typing:598682375303593985> **Loading...**' });
        this.loadingText = '<a:Typing:598682375303593985> **Loading...**';
        this.tagManager = new TagHandler(client);
        this.tempvcmanager = new TempChannelManager(client)
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


    public async sleep(ms: number): Promise<unknown> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static splitMessagebyChar(text: string, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}): string[] {
        if (text.length <= maxLength) return [text];
        const splitText = text.split(char);
        if (splitText.some(chunk => chunk.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg !== prepend ? msg + append : []);
    }

    public splitString(str: string, limit: number): string[] {
        const result = [];
        if (str.length <= limit) {
            result.push(str);
            return result;
        }
        let startIndex = 0;
        let endIndex = limit;
        while (endIndex < str.length) {
            const lastSpaceIndex = str.lastIndexOf(' ', endIndex);
            if (lastSpaceIndex > startIndex) {
                result.push(str.substring(startIndex, lastSpaceIndex));
                startIndex = lastSpaceIndex + 1;
            } else {
                result.push(str.substring(startIndex, endIndex));
                startIndex = endIndex;
            }
            endIndex = startIndex + limit;
        }
        result.push(str.substring(startIndex));
        return result.filter((s) => s.length > 0);
    }

    public splitMessage(str: string, size: number): string[] {
        const numChunks = Math.ceil(str.length / size);
        const chunks = new Array<string>(numChunks);
        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            chunks[i] = str.slice(o, size);
        }
        return chunks;
    }

    public async slashCommandBuilder(message: Message<true>): Promise<void | Message<true>> {
        const [cmd, ...args] = message.content.split(' ');
        console.log(cmd,args)
        if (message.content.match(/help/gi)) {
            const buildUsage = [
                '`build` - Build Server Commands',
                '`build deploy <command_name>` - *Deploy* a specific server command..',
                '`build reload <command_name>` - *Reload* a specific server command.',
                '`build all_guild` - Build Server Commands ignoring global flags.',
                '`build guild removeall` - Remove All Server Commands',
                '`build help` - Shows this message',
                '`build global` - Build Global Commands',
                '`build removeall` - Remove All Global Commands',
            ];
            return message.reply({ content: buildUsage.join('\n') });
        }

        // handle removing ALL commands
        if (message.content.match(/removeall/gi)) {
            // remove only the guilds commands
            if (message.content.match(/guild/gi))
                await message.guild?.commands.set([]).catch(async (err: Error) => {
                    console.error({
                        error: err.stack,
                        handler: this.constructor.name,
                    });
                    await message.react('❎');
                });
            // remove all slash commands globally
            else
                await this.client.application?.commands.set([]).catch(async (err: Error) => {
                    console.error({
                        error: err.stack,
                        handler: this.constructor.name,
                    });
                    await message.react('❎');
                });
            return message.reply({ content: 'Done' });
        }

        // global commands
        if (message.content.match(/global/gi)) {
            if (!this.client.application) return message.reply({ content: `There is no client.application?` }).catch(() => void 0);
            const data = await this.buildCommands('global');
            const res = await this.client.application.commands.set(data).catch((e: Error) => e);
            if (res instanceof Error) {
                console.error({
                    error: res.stack,
                    handler: this.constructor.name,
                });
                return void !0;
            }
            return message
                .reply({
                    content: `Deploying (**${data.length.toLocaleString()}**) slash commands, This could take up to 1 hour.\n\`\`\`diff\n${data
                        .map((command) => `${command.default_member_permissions === '0' ? '-' : '+'} ${command.name} - '${command.description}'`)
                        .join('\n')}\n\`\`\``,
                })
                .catch(() => void 0);
        }

        if (message.content.match(/all_guild/gi)) {
            // guild commands
            const data = await this.buildCommands('all_guild');

            const res = await message.guild.commands.set(data).catch((e: Error) => e);
            if (res instanceof Error) {
                console.error({ error: res.stack, handler: this.constructor.name });
                return void !0;
            }
            return message
                .reply({
                    content: `Deploying **ALL_GUILD** Overwrites (**${data.length.toLocaleString()}**) slash commands\n\`\`\`diff\n${data
                        .map((command) => `${command.default_member_permissions === '0' ? '-' : '+'} ${command.name} - '${command.description}'`)
                        .join('\n')}\n\`\`\``,
                })
                .catch(() => void 0);
        }

        if (message.content.match(/deploy/gi)) {
            const data = await this.buildCommands('guild', args[2]);
            if (data.length === 0) return message.reply('Failed to load commands');
            const dataReturned = data.map(c => `${c.default_member_permissions ? '-' : '+'} ${c.name} - '${c.description}'`).join('\n');
            try {
                await message.guild.commands.set(data)
                return await message.reply({ content: `Deploying (**${data.length.toLocaleString()}**) slash commands\n${codeBlock('diff', dataReturned)}` })
            } catch (error) {
                return await message.reply({ content: `There was an error deploying.` })
            }
        }


        // this will delete all other commands and reload only the single one provided (TODO)
        if (message.content.match(/reload/gi)) {
            // guild commands
            const data = await this.buildCommands('guild', args[2]);
            if (data.length === 0) return message.reply('Failed to load commands'); 
            const allCommands: Collection<string, ApplicationCommand> = await message.guild.commands.fetch();
            const allGlobalCommands = await this.client.application?.commands.fetch() as Collection<string, ApplicationCommand>;
            const commandToEdit = allCommands.filter(c => c.name === args[2]).first() ?? null;
            const globalCommandToEdit = allCommands.size === 0 ? allGlobalCommands.filter(c => c.name === args[2]).first() ?? null : null;
            if(!commandToEdit && !globalCommandToEdit) return await message.reply(`The command **${args[2]}** was not found, please deploy your commands first.`)
            const editData = data[0].toJSON() as ApplicationCommandData;
            try {
                globalCommandToEdit ? await globalCommandToEdit.edit(editData) : void 0;
                commandToEdit ? await commandToEdit.edit(editData) : void 0;
            } catch (error) {
                return message.reply({ content: `There was an error re-building the command (**${args[2]}**)` })
            }

            return message
                .reply({
                    content: `Reloading (**${data.length.toLocaleString()}**) (**${globalCommandToEdit ? 'GLOBAL': commandToEdit ? 'GUILD' : 'GLOBAL'}**) slash commands\n\`\`\`diff\n${data
                        .map((command) => `${command.default_member_permissions === '0' ? '-' : '+'} ${command.name} - '${command.description}'`)
                        .join('\n')}\n\`\`\``,
                })
                .catch(void 0);
        }

        // guild commands
        const data = await this.buildCommands('guild');

        const res = await message.guild.commands.set(data).catch((e: Error) => e);
        if (res instanceof Error) {
            console.error({
                error: res.stack,
                handler: this.constructor.name,
            });
            return void !0;
        }
        return message
            .reply({
                content: `Deploying (**${data.length.toLocaleString()}**) slash commands\n\`\`\`diff\n${data
                    .map((command) => `${command.default_member_permissions === '0' ? '-' : '+'} ${command.name} - '${command.description}'`)
                    .join('\n')}\n\`\`\``,
            })
            .catch(() => void 0);
        
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

    public async buildCommands(type: 'global' | 'guild' | 'all_guild', cmd?: string): Promise<SlashCommandBuilder[]> {
        const data = []
        for await (const directory of readdirSync(`${this.client.location}/src/interactions`, { withFileTypes: true })) {
            if (!directory.isDirectory()) continue;
            for await (const command of readdirSync(`${this.client.location}/src/interactions/${directory.name}`, { withFileTypes: true })) {
                if (!command.isFile()) continue;
                if (command.name.endsWith('.ts')) {
                    const { default: Interaction } = await import(`${this.client.location}/src/interactions/${directory.name}/${command.name}`) as { default: new (client: Bot) => BotInteraction }
                    const Command = new Interaction(this.client)
                    if (type === 'all_guild') {
                        Command.enabled ? data.push(Command.slashData) : void 0
                    }
                    if (type === 'global') {
                        Command.global && Command.enabled ? data.push(Command.slashData) : void 0
                    }
                    if (type === 'guild' && !cmd) {
                        !Command.global && Command.enabled ? data.push(Command.slashData) : void 0
                    }
                    if (cmd && command.name.toLowerCase().split('.ts')[0] === cmd) {
                        data.push(Command.slashData)
                    }
                }
            }
        }
        return data;
    }

    
    public async checkGuidesForums(message: Message<true>): Promise<Message<true> | undefined> {
        let result = '';
        let _count = 0;
        // eslint-disable-next-line no-useless-escape
        const forumPostExtensionRegex = /<#[0-9]*>\s*\/[\*a-zA-Z0-9\/]*/g;
        const found = message.content.match(forumPostExtensionRegex);
        if (found) {
            let spamStopped = false;
            let spamstop = 0;
            for (let i = 0; i < found.length; i++) {
                if (spamstop > 2) {
                    //limits to 3 total results being parsed out of the message. prevents spamming a ton of #afkguides/helwyr 100000 times
                    spamStopped = true;
                    continue;
                }
                const relevantString = found[i].toString();
                const channelID = relevantString.split('>')[0].split('#')[1]; //this is so fucking dumb but oh well
                const searchTokens = relevantString.split('>')[1].trim().split('/').splice(1);
                const cached_channel = await this.client.channels.fetch(channelID, { force: true });
                if (cached_channel?.type === ChannelType.GuildForum) {
                    const all_posts = this.client.channels.cache.filter((channel) => channel.isThread()) as Collection<string, ThreadChannel>;
                    if (all_posts.size === 0) return void 0;
                    const posts = all_posts.filter((post) => post.parentId === channelID);
                    let spamstop2 = 0;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    for await (const [_id, post] of posts) {
                        for await (const token of searchTokens) {
                            if (token.length < 1) {
                                continue;
                            }
                            if (spamstop2 > 4) {
                                //limits any one forum-post lookup to return more than 5 channel links
                                spamStopped = true;
                                continue;
                            }
                            if (post.name.toLowerCase().includes(token.toLowerCase().trim()) || token.toLowerCase().trim() == "*") {
                                _count++;
                                result += `<#${post.id}>\n`;
                                // if(token != "*") { //can add this in if the wildcard gets truncated too much
                                spamstop2++;
                                // }
                            }
                        }
                    }
                } else return void 0;
                spamstop++;
            }
            if (_count === 0) return;
            return message.reply({
                content: `Found ${_count} Guide Results\n${
                    spamStopped ? 'Results have been truncated to reduce spam. If the guide you were looking for is not here, try refining your search.\n' : ''
                }${result}`,
                allowedMentions: { repliedUser: false },
            });
        } else return void 0;
    }

    public removeArrayIndex(array: Array<unknown>, indexID: number): unknown[] {
        return array.filter((_: unknown, index) => index != indexID - 1);
    }

    public checkURL(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch (error) {
            return false;
        }
    }

    public trim(string: string, max: number): string {
        return string.length > max ? string.slice(0, max) : string;
    }

    public convertMS(ms: number | null): string {
        if (!ms) return 'n/a';
        const seconds = (ms / 1000).toFixed(1),
            minutes = (ms / (1000 * 60)).toFixed(1),
            hours = (ms / (1000 * 60 * 60)).toFixed(1),
            days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
        if (Number(seconds) < 60) return seconds + ' Sec';
        else if (Number(minutes) < 60) return minutes + ' Min';
        else if (Number(hours) < 24) return hours + ' Hrs';
        else return days + ' Days';
    }

    public convertBytes(bytes: number): string {
        const MB = Math.floor((bytes / 1024 / 1024) % 1000);
        const GB = Math.floor(bytes / 1024 / 1024 / 1024);
        if (MB >= 1000) return `${GB.toFixed(1)} GB`;
        else return `${Math.round(MB)} MB`;
    }

    public convertUserIDArrayToStringOfMentions(userIDs: string[] | undefined): string {
        let result = "";
        if(!userIDs) {
            return result;
        }
        userIDs.forEach(userID => result += `<@${userID}> `);
        return result;
    }
}
