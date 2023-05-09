import { BotInteraction } from '../../abstract/BotInteraction';
import { ChatInputCommandInteraction } from 'discord.js';
import Bot from '../../Bot';

export default class Invite extends BotInteraction {
    constructor(client: Bot) {
        super(client);
        this.cmdName = "invite";
        this.description = "Invite the bot to your server!";
        this.global = true;
        this.slashData.setName(this.cmdName).setDescription(this.description);
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply(`Click the \`Add to Server\` button in my profile or click the link below.\n${this.client.util.config.inviteUrl}`);
    }
}