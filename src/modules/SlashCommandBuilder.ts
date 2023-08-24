import { ApplicationCommand, ApplicationCommandData, Collection, Message, SlashCommandBuilder, codeBlock } from "discord.js"
import Bot from "../Bot";
import { BotInteraction } from "../abstract/BotInteraction";
import { readdirSync } from "fs";

export async function buildCommands(client: Bot, type: 'global' | 'guild' | 'all_guild', cmd?: string): Promise<SlashCommandBuilder[]> {
    const data = []
    for await (const directory of readdirSync(`${client.location}/src/interactions`, { withFileTypes: true })) {
        if (!directory.isDirectory()) continue;
        for await (const command of readdirSync(`${client.location}/src/interactions/${directory.name}`, { withFileTypes: true })) {
            if (!command.isFile()) continue;
            if (command.name.endsWith('.ts')) {
                const { default: Interaction } = await import(`${client.location}/src/interactions/${directory.name}/${command.name}`) as { default: new (client: Bot) => BotInteraction }
                const Command = new Interaction(client)
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


export async function slashCommandModule(client: Bot, message: Message<true>): Promise<void | Message<true>> {
        const [cmd, ...args] = message.content.split(' ');
        console.log('[COMMANDS BUILDER]',cmd,args)
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
                    client.logger.error({
                        error: err.stack,
                        handler: slashCommandModule.name,
                    });
                    await message.react('❎');
                });
            // remove all slash commands globally
            else
                await client.application?.commands.set([]).catch(async (err: Error) => {
                    client.logger.error({
                      error: err.stack,
                      handler: slashCommandModule.name,
                    });
                    await message.react('❎');
                });
            return message.reply({ content: 'Done' });
        }

        // global commands
        if (message.content.match(/global/gi)) {
            if (!client.application) return message.reply({ content: `There is no client.application?` }).catch(() => void 0);
            const data = await buildCommands(client, 'global');
            const res = await client.application.commands.set(data).catch((e: Error) => e);
            if (res instanceof Error) {
                client.logger.error({
                    error: res.stack,
                    handler: slashCommandModule.name,
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
            const data = await buildCommands(client, 'all_guild');

            const res = await message.guild.commands.set(data).catch((e: Error) => e);
            if (res instanceof Error) {
                client.logger.error({ error: res.stack, handler: slashCommandModule.name });
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
            const data = await buildCommands(client, 'guild', args[2]);
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
            const data = await buildCommands(client, 'guild', args[2]);
            if (data.length === 0) return message.reply('Failed to load commands'); 
            const allCommands: Collection<string, ApplicationCommand> = await message.guild.commands.fetch();
            const allGlobalCommands = await client.application?.commands.fetch() as Collection<string, ApplicationCommand>;
            const commandToEdit = allCommands.filter(c => c.name === args[2]).first() ?? null;
            const globalCommandToEdit = allCommands.size === 0 ? allGlobalCommands.filter(c => c.name === args[2]).first() ?? null : null;
            if (!commandToEdit && !globalCommandToEdit) return await message.reply(`The command **${args[2]}** was not found, please deploy your commands first.`)
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
        const data = await buildCommands(client, 'guild');

        const res = await message.guild.commands.set(data).catch((e: Error) => e);
        if (res instanceof Error) {
            client.logger.error({
                error: res.stack,
                handler: slashCommandModule.name,
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