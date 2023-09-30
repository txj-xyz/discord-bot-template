import { BotInteraction } from '../../abstract/BotInteraction';
import { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, codeBlock } from 'discord.js';
import Bot from '../../Bot';

export default class Settings extends BotInteraction {
    constructor(client: Bot) {
        super(client);
        this.cmdName = "settings";
        this.description = "Live toggle features throughout the bot!";
        this.permissions = "OWNER";
        this.slashData
            .setName(this.cmdName)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName('option')
                    .setDescription('Which setting to toggle')
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addBooleanOption((option) =>
                option
                    .setName('action')
                    .setDescription('Enable / Disable this setting?')
                    .setRequired(true)
        );
    }

    autocomplete(interaction: AutocompleteInteraction<'cached'>): Promise<unknown> {
        const options: ApplicationCommandOptionChoiceData[] =
            [
                { name: '--------------------------', value: 'NULL' },
                { name: 'SHOW ALL SETTINGS', value: 'SHOW_ALL_SETTINGS' },
                { name: '--------------------------', value: 'NULL' },
                ...this.client.configmap.toSlashCommandOptions(),
            ]
        return interaction.respond(options)
    }

    async run(interaction: ChatInputCommandInteraction<'cached'>): Promise<void> {
        // Get options from user
        const [option, action] = [
            interaction.options.getString('option', true),
            interaction.options.getBoolean('action', true)
        ];

        // Show all possible configmap settings 
        if (option === "SHOW_ALL_SETTINGS" || option === "NULL") {
            const embeds = [
                new EmbedBuilder()
                    .setAuthor({ name: `Bot Settings - Listing` })
                    .setDescription(codeBlock('diff', this.client.configmap.toHelp().join('\n')))
                    .setColor('Green')
                    .setTimestamp()
            ];
            return void await interaction.reply({ embeds, ephemeral: true });
        }

        // Check to see if the option picked exists in the system
        if (typeof this.client.configmap.get(option) === 'undefined') {
            const embeds = [
                new EmbedBuilder()
                    .setAuthor({ name: `Bot Settings - Update Failed` })
                    .setDescription(`**${option}** does not exist, please select a valid toggle.\n${codeBlock('diff', this.client.configmap.toHelp().join('\n'))}`)
                    .setColor('Red')
                    .setTimestamp()
            ];
            return void await interaction.reply({ embeds, ephemeral: true });
        }
        
        // Success
        this.client.configmap.set(option, action);
        const embeds = [
            new EmbedBuilder()
                .setAuthor({ name: `Bot Settings - Update` })
                .setDescription(`**${option}** is now **\`${action ? 'enabled' : 'disabled'}\`**`)
                .setColor(action ? 'Green' : 'Red')
                .setTimestamp()
        ];
        return void await interaction.reply({ embeds })
    }
}