import { BotInteraction } from '../../abstract/BotInteraction';
import { ChatInputCommandInteraction } from 'discord.js';
import Bot from '../../Bot';

export default class Ping extends BotInteraction {
    constructor(client: Bot) {
        super(client);
        this.cmdName = "ping";
        this.description = "Basic pongy command!";
        this.slashData.setName(this.cmdName).setDescription(this.description);
    }

    async run(interaction: ChatInputCommandInteraction<'cached'>): Promise<void> {
        const pingTime = Date.now();
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply(`Took \`${Date.now() - pingTime}ms\``);
    }
}