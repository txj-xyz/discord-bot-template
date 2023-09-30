import { EmbedBuilder } from 'discord.js';
import { BotInteraction } from '../../abstract/BotInteraction';
import { ChatInputCommandInteraction } from 'discord.js';
import Bot from '../../Bot';

export default class Stats extends BotInteraction {
    constructor(client: Bot) {
        super(client);
        this.cmdName = "stats";
        this.description = "Basic pongy command!";
        this.slashData.setName(this.cmdName).setDescription(this.description);
    }

    get memory(): string[] {
        const _result = [];
        for (const [key, value] of Object.entries(process.memoryUsage())) {
            _result.push(`${key}: ${value / 1000000}MB`);
        }
        return _result;
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const pingTime = Date.now();
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setColor(this.client.color ?? 0x00000)
            .setTitle('Status')
            .setDescription(
                `\`\`\`ml\n
Guilds      :: ${this.client.guilds.cache.size}
User Count  :: ${this.client.guilds.cache.map((g) => g.memberCount).reduce((a, c) => a + c)}
Channels    :: ${this.client.channels.cache.size}
Ping        :: ${Math.round(Date.now() - pingTime)} MS
Uptime      :: ${this.client.util.convertMS(this.client.uptime)}
Memory      :: ${JSON.stringify(this.memory, null, 2)}
\`\`\``
            )
            .setTimestamp()
            .setFooter({ text: this.client.user?.username as string, iconURL: this.client.user?.displayAvatarURL() });
        await interaction.editReply({ embeds: [embed], components: [] });
    }
}