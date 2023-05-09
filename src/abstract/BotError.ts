import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export abstract class BotError extends Error {
    constructor(msg: string) {
        super(msg)
    }
    abstract showError(interaction: ChatInputCommandInteraction<'cached'>): Promise<void>;
}

export class MessageBotError extends BotError {
    constructor(msg: string) {
        super(msg)
    }

    async showError(interaction: ChatInputCommandInteraction<'cached'>): Promise<void> {
        interaction.replied ? await interaction.reply(this.message) : await interaction.editReply(this.message);
    }
}

export class EmbedBotError extends BotError {
    private embed: EmbedBuilder
    constructor(msg: string, embed: EmbedBuilder) {
        super(msg)
        this.embed = embed;
    }

    async showError(interaction: ChatInputCommandInteraction) : Promise<void> {
        await interaction.reply({ embeds: [this.embed] });
    }
}