import { Collection, Interaction, EmbedBuilder }  from 'discord.js';
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
            return this.exec(interaction) as Promise<void>;
        });
    }

    async build(): Promise<Collection<string, BotInteraction>> {
        const pattern = `${this.client.location}/src/interactions/*/!(*.d).{ts,js}`;
        const files = await glob(pattern);
        let foundCommands = 0;
        !this.client.production ? this.client.logger.warn({ message: `Found '${files.length}' commands to be queued into loading.`, handler: this.constructor.name }) : void 0;
        !this.client.production ? this.client.logger.warn({ message: `Loading commands please wait....`, handler: this.constructor.name }) : void 0;
        for (let index = 0; index < files.length; index++) {
            const f = files[index];
            foundCommands++;
            const { default: Interaction } = await import(f) as { default: new (client: Bot) => BotInteraction };
            const Command = new Interaction(this.client);
            this.commands.set(Command.cmdName, Command);
            !this.client.production ? this.client.logger.warn({ message: `Command '${Command.cmdName}' loaded`, handler: this.constructor.name }) : void 0;
        }
        this.client.logger.info({ handler: this.constructor.name, message: `Loaded ${this.commands.size}/${foundCommands} interaction client command(s)` });
        this.built = true;
        return this.commands;
    }

    async exec(interaction: Interaction): Promise<unknown> {
        
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

        // Future possible IPC / Cluster implementation?
        if (interaction.isCommand()) {
            try {
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
                    this.client.logger.error({
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
