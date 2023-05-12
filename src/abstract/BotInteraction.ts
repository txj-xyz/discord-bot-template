import { BotPermissionTypes } from "../types/PermissionTypes";
import { AutocompleteInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, SlashCommandBuilder } from 'discord.js';
import Bot from '../Bot';


export interface BotInteraction {
    uid: string;
    client: Bot;
    enabled: boolean;
    name: string;
    description: string;
    slashData: SlashCommandBuilder;
    permissions: BotPermissionTypes;
    global: boolean;
    category: string;
    run(interaction: ChatInputCommandInteraction<'cached'>): Promise<void | unknown>;
    autocomplete?(interaction: AutocompleteInteraction<'cached'>): Promise<void | unknown>;
    modal?(interaction: ModalSubmitInteraction<'cached'>): Promise<void | unknown>;
}

export abstract class BotInteraction implements BotInteraction {
    public client: Bot;
    public enabled: boolean;
    public name: string;
    public description: string;
    public slashData: SlashCommandBuilder;
    public permissions: BotPermissionTypes;
    public global: boolean;
    public category: string;

    constructor(client: Bot) {
        this.client = client;
        this.enabled = true;
        this.name = "";
        this.description = "";
        this.slashData = new SlashCommandBuilder();
        this.permissions = 'ALL';
        this.global = false;
        this.category = "";
    }
}