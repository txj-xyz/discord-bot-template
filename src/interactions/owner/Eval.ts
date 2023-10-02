import { ChatInputCommandInteraction, SlashCommandStringOption, EmbedBuilder, SlashCommandBooleanOption } from 'discord.js';
import { inspect } from 'util';
import { BotInteraction } from '../../abstract/BotInteraction';
import Bot from '../../Bot';

export default class Eval extends BotInteraction {
    constructor(client: Bot) {
        super(client);
        this.cmdName = "eval";
        this.description = "Evaluate code in the scope of Eval#Class!";
        this.permissions = 'OWNER';
        this.slashData.setName(this.cmdName)
            .setDescription(this.description)
            .addStringOption((option: SlashCommandStringOption) => option.setName('code').setDescription('Evaluate Code from interaction scope.').setRequired(true))
            .addBooleanOption((option: SlashCommandBooleanOption) => option.setName('ephemeral').setDescription('Respond privately or in the channel.'));
    }

    trim(string: string, max: number): string {
        return string.length > max ? string.slice(0, max) : string;
    }

    async run(interaction: ChatInputCommandInteraction<'cached'>): Promise<void> {
        const type = interaction.options.getBoolean('ephemeral');
        await interaction.deferReply(type ? { ephemeral: type } : undefined);
        const code = interaction.options.getString('code', true);
        let res: unknown;
        try {
            res = await eval(code);
            res = inspect(res, { depth: 1 });
        } catch (error) {
            res = inspect(error, { depth: 1 });
        }
        const embed = new EmbedBuilder()
            .setColor(this.client.color)
            .setTitle('Eval Results')
            .setDescription(`📥Input:\n\`\`\`${code}\`\`\`\n\n\`\`\`js\n${this.trim(res as string, 1900)}\`\`\``) // (TODO) yikes wtf is this
            .setTimestamp()
            .setFooter({ text: this.client.user?.username ?? 'dejj', iconURL: this.client.user?.displayAvatarURL() });
        await interaction.editReply({ embeds: [embed] });
    }
}