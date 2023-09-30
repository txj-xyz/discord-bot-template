import { BotInteraction } from '../../abstract/BotInteraction';
import { ChatInputCommandInteraction } from 'discord.js';
import Bot from '../../Bot';

export default class Invite extends BotInteraction {
    constructor(client: Bot) {
        super(client);
        this.cmdName = "invite";
        this.global = true;
        this.description = "Invite the bot to your server!";
        this.slashData.setName(this.cmdName).setDescription(this.description);
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false });
        await interaction.editReply(`Click the \`Add to Server\` button in my profile by clicking on my name or click the link below to invite me!.\nhttps://discord.com/api/oauth2/authorize?client_id=1015008038823931994&permissions=414464727104&scope=bot`);
    }
}