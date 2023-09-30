import { Collection, Interaction, CommandInteraction, InteractionResponse, EmbedBuilder }  from 'discord.js';
import Bot from '../Bot';
import { BotInteraction } from '../abstract/BotInteraction';
import { glob } from 'glob';
import { BotError } from '../abstract/BotError';

export default interface InteractionHandler {
    client: Bot;
    commands: Collection<string, BotInteraction>;
    built: boolean;
}

export default class InteractionHandler {
    constructor(client: Bot) {
        this.commands = new Collection<string, BotInteraction>();
        this.built = false;
        this.client = client;
        this.client.on('interactionCreate', (interaction: Interaction) => {
            const { guildId, user: { id: userId }, channelId } = interaction as Interaction<'cached'>;
            const ban = client.blacklist.checkInteractionAll(interaction, { guildId, userId, channelId: (channelId as string) })
            if (ban) return;
            this.exec(interaction) as Promise<void>;
            return void 0
        });
    }

    async build(): Promise<Collection<string, BotInteraction>> {
        const pattern = `${this.client.location}/src/interactions/*/!(*.d).{ts,js}`;
        const files = await glob(pattern);
        let foundCommands = 0;
        !this.client.production ? console.log({ message: `Found '${files.length}' commands to be queued into loading.`, handler: this.constructor.name }) : void 0;
        !this.client.production ? console.log({ message: `Loading commands please wait....`, handler: this.constructor.name }) : void 0;
        for (let index = 0; index < files.length; index++) {
            const f = files[index];
            foundCommands++;
            const { default: Interaction } = await import(f) as { default: new (client: Bot) => BotInteraction };
            const Command = new Interaction(this.client);
            this.commands.set(Command.cmdName, Command);
            !this.client.production ? console.log({ message: `Command '${Command.cmdName}' loaded`, handler: this.constructor.name }) : void 0;
        }
        console.log({ handler: this.constructor.name, message: `Loaded ${this.commands.size}/${foundCommands} interaction client command(s)` });
        this.built = true;
        return this.commands;
    }


    public async denialResponse(interaction: CommandInteraction, command: BotInteraction, permissions_required: string): Promise<InteractionResponse<boolean>> {
        console.error(
            {
                message: `Attempted restricted permissions.`,
                command: command.cmdName,
                user: interaction.user.username,
                handler: this.constructor.name,
            }
        );
        const message = await interaction.reply({
            content: `You do not have permissions to run this command, please ask a user with the role **${permissions_required}** or **SERVER STAFFf** to run this command.`,
            ephemeral: true
        });
        return message;
    }

    async exec(interaction: Interaction): Promise<unknown> {
        
        // Ignore non-cached guilds
        if (!interaction.inCachedGuild()) return;

        // As of 4/11/23 this is hardcoded to include modal submission checks to pull the command from the client collection and execute the `modal()` method
        const command: BotInteraction | undefined = interaction.isCommand() || interaction.isAutocomplete() ? this.commands.get(interaction.commandName) : interaction.isModalSubmit() ? this.commands.get(interaction.customId) : undefined;
        if (!command) return interaction.isRepliable() ? await interaction.reply({ content: 'Internal Error Occurred. Command not loaded correctly.', ephemeral: true }) : void !0;
        if (interaction.isCommand() && !command.enabled) return interaction.isRepliable() ? await interaction.reply({ content: `This command is currently disabled.`, ephemeral: true }) : void !0;

        // Command is defined at this point, if it's not found then there needs to be logic changes to `const command`

        // Handle autocomplete only interactions here
        if (interaction.isAutocomplete() && command.autocomplete) return await command.autocomplete(interaction);

        // Handle modal event per command
        if (interaction.isModalSubmit() && command.modal) return await command.modal(interaction);

        if (interaction.isCommand()) {
            try {
                switch (command.permissions) {
                    // case 'EDITOR':
                    //     if (!this.client.util.checkPermissions('id', interaction, [
                    //         role_ids.admin,
                    //         role_ids.moderator
                    //     ])) {
                    //         await this.denialResponse(interaction, command, command.permissions);
                    //         return;
                    //     }
                    //     break;
                    case 'OWNER': // RCM + TXJ
                        if (!this.client.util.config.owners.includes(interaction.user.id)) {
                            await this.denialResponse(interaction, command, command.permissions);
                            return;
                        }
                        break;
                    case 'ALL': // Everyone
                        break;
                    default:
                        break;
                }
                console.log(
                    {
                        handler: this.constructor.name,
                        user: `${interaction.user.username} | ${interaction.user.id}`,
                        channel: `${interaction.channel?.name ?? 'Internal Error Occurred'} | ${interaction.channelId}`,
                        message: `Executing Command ${command.cmdName}`,
                        args: interaction.options.data.map((e) => ({
                            interaction_name: e.name,
                            interaction_args: e.options?.map((cmd) => ({
                                name: cmd.name,
                                value: cmd.value,
                            })),
                        })),
                    }
                );
                interaction.isChatInputCommand() ? await command.run(interaction) : void 0;
            }

            catch (error) {
                if (error instanceof BotError) {
                    interaction.isChatInputCommand() && await error.showError(interaction)
                } else {
                    const { stack, message, name } = error as Error
                    const embed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('Error Detected!')
                        .setDescription(`\`\`\`js\n${name} - ${message}\`\`\``)
                        .setTimestamp()
                        .setFooter({ text: this.client.user?.username ?? '', iconURL: this.client.user?.displayAvatarURL() });
                    console.error({
                        handler: this.constructor.name,
                        message: 'Error Detected!',
                        error: stack ?? 'Internal Error Occurred',
                    });

                    interaction.replied || (interaction.deferred && !interaction.replied) ? await interaction.editReply({ content: null, embeds: [embed] }) : console.error(error)
                }
            }
        }
    }
}
