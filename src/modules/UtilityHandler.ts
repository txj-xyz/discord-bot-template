import * as config from '../../config/config.json';
import { EmbedBuilder, Message, SlashCommandBuilder, GuildMember, Collection, Interaction, ApplicationCommand, ApplicationCommandData, codeBlock } from 'discord.js';
import Bot from '../Bot';
import { readFileSync, readdirSync } from 'fs';
import { BotInteraction } from '../abstract/BotInteraction';

export default interface UtilityHandler {
    client: Bot;
    config: typeof config;
    random(array: Array<unknown>): Array<number>;
    loadingEmbed: EmbedBuilder;
    loadingText: string;
    slashCommandBuilder(message: Message<true>): Promise<void | Message<true>>;
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
                    this.client.logger.error({
                        error: err.stack,
                        handler: this.constructor.name,
                    });
                    await message.react('❎');
                });
            // remove all slash commands globally
            else
                await this.client.application?.commands.set([]).catch(async (err: Error) => {
                    this.client.logger.error({
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
                this.client.logger.error({
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
                this.client.logger.error({ error: res.stack, handler: this.constructor.name });
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
            this.client.logger.error({
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
}
