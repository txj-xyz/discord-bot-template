import { Message } from "discord.js";
import { BotEvent } from "../abstract/BotEvent";
import { slashCommandModule } from "../modules/SlashCommandBuilder";

export default class MessageCreate extends BotEvent {
  get name(): string {
    return "messageCreate";
  }

  get fireOnce(): boolean {
    return false;
  }

  get enabled(): boolean {
    return true;
  }

  async run([message]: [Message]): Promise<void | Message<true>> {
    if (message.author.bot) return;
    if (!message.inGuild()) return;
    
    if (
      message.mentions.users.first()?.id == this.client.user?.id &&
      this.client.util.config.owners.includes(message.author.id) &&
      message.content.includes(`build`)
    ) {
      return await slashCommandModule(this.client, message);
    }
  }
}
