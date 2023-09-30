import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildBasedChannel, Message, TextChannel, blockQuote, bold, underscore } from 'discord.js';
import Bot from '../Bot';

class MessageScraper {
    private client: Bot;
    /** The role ID to listen to messages for */
    private roleId: string;
    /** The channel ID you want to preview messages to send */
    private previewChannelId: string;
    /** The final output channel ID to send the message you confirmed */
    private confirmationChannelId: string;

    constructor(client: Bot, roleId: string, previewChannelId: string, confirmationChannelId: string) {
        this.client = client;
        this.roleId = roleId;
        this.previewChannelId = previewChannelId;
        this.confirmationChannelId = confirmationChannelId;
    }

    /**
     * Check to make sure the Scraper module is enabled via configmap.
     * @returns `boolean`
     */
    private get enabled(): boolean {
        return this.client.configmap.check('JAGEX_MOD_COMMENT_SCRAPER');
    }
    
    public async messageCheck(message: Message): Promise<void> {
        if (!this.enabled) return;
        if (message.author.bot) return;
        
        const member = message.guild?.members.cache.get(message.author.id);
        if (member?.roles.cache.has(this.roleId)) {
            const previewChannel = this.client.channels.cache.get(this.previewChannelId) as TextChannel;
            const confirmationButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm-${message.id}-${message.channelId}-${this.confirmationChannelId}`)
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`deny-${message.id}-${message.channelId}-${this.confirmationChannelId}`)
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger)
            );

            const jmodName = message.member?.displayName ?? message.author.username

            // Reply to a message additional footer
            if (message.reference?.messageId) {
                const g = await this.client.guilds.fetch(message.reference.guildId ?? message.guildId as string);
                const c = await g.channels.fetch(message.reference.channelId) as GuildBasedChannel;
                const msgReply = c.isTextBased() ? await c.messages.fetch(message.reference.messageId) : null;
                const embedReply = new EmbedBuilder()
                    .setTitle(`${underscore('New JMOD Message')}`)
                    .setColor(39423)
                    .setTimestamp()
                    .setDescription(`${bold(underscore(jmodName))} said ${message.url}\n${blockQuote(message.content)}`)
                    .setFooter(
                        msgReply ?
                        { text: `In reply to: ${msgReply.content.slice(0, 80)}`, iconURL: this.client.user?.displayAvatarURL() } :
                        { text: this.client.user?.username ?? 'dejj', iconURL: this.client.user?.displayAvatarURL() }
                    )
                
                return void await previewChannel.send({
                    components: [confirmationButtons],
                    files: message.attachments.map(a => a) ?? [],
                    embeds: [embedReply]
                })
            }

            const embedReply = new EmbedBuilder()
                .setTitle(`${underscore('New JMOD Message')}`)
                .setColor(39423)
                .setTimestamp()
                .setDescription(`${bold(underscore(jmodName))} said ${message.url}\n${blockQuote(message.content)}`)

            return void await previewChannel.send({
                components: [confirmationButtons],
                files: message.attachments.map(a => a) ?? [],
                embeds: [embedReply]
            })
        }
    }
}

export { MessageScraper }