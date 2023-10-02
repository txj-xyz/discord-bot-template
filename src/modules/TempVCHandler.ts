import { ParentChannelOptions, TempChannelsManager, TempChannelsManagerEvents } from '@hunteroi/discord-temp-channels';
import Bot from '../Bot';

export default interface TempChannelManager {
    client: Bot;
    listeningChannels: string[];
    on(eventName: TempChannelsManagerEvents, listener: (...args: unknown[]) => void | Promise<void>): this;
}

export default class TempChannelManager extends TempChannelsManager {
    constructor(client: Bot) {
        super(client);
        this.client = client;
        this.listeningChannels = []
        this.on(TempChannelsManagerEvents.error, (err) => console.log('[TempManager]', err))
        // this.on(TempChannelsManagerEvents.channelRegister, (parent) => console.log('Registered', parent));
        // this.on(TempChannelsManagerEvents.channelUnregister, (parent) => console.log('Unregistered', parent));
        // this.on(TempChannelsManagerEvents.childAdd, (child, parent) => console.log('Child added!', child, parent));
        // this.on(TempChannelsManagerEvents.childRemove, (child, parent) => console.log('Child removed!', child, parent));
        // this.on(TempChannelsManagerEvents.childPrefixChange, (child) => console.log('Prefix changed', child));
        this.loaded();
        setInterval(() => {
            !this.client.configmap.check('TEMP_VOICE_CHANNELS_MODULE') ? this.listeningChannels.length > 0 ? this.listeningChannels.map(channelId => this.unregisterChannelLister(channelId)) : void 0 : void 0;
            this.client.configmap.check('TEMP_VOICE_CHANNELS_MODULE') && !this.listeningChannels.includes(this.client.util.config.modules.tempVCHandler.channelID) ? this.registerChannelListener(this.client.util.config.modules.tempVCHandler.channelID,this.client.util.config.modules.tempVCHandler.categoryID) : void 0;
        }, 10 * 1000)
    }


    /**
     * Setup temporary VC channels, click to join and create channel
     * @param channelId `voice channel id to start a listener for` 
     * @param options `ParentChannelOptions`
     * @returns 
     */
    public registerChannelListener(channelId: string, categoryId: string, options?: ParentChannelOptions): void {
        if (!this.client.configmap.check('TEMP_VOICE_CHANNELS_MODULE')) return void 1;
        this.listeningChannels.push(channelId)
        return this.registerChannel(channelId, options || {
            childCategory: categoryId,
            childAutoDeleteIfEmpty: true,
            childCanBeRenamed: false,
            childAutoDeleteIfParentGetsUnregistered: true,
            childAutoDeleteIfOwnerLeaves: false,
            childOverwriteRolesAndUsers: [],
            childPermissionOverwriteOptions: {
                Connect: true,
                ManageChannels: false,
            },
            childVoiceFormat: (str, count): string => `#${count} | ${str}`,
            childVoiceFormatRegex: /^#\d+ \|/,
            childBitrate: 64000
        })
    }

    public unregisterChannelLister(channelId: string): void {
        try {
            delete this.listeningChannels[this.listeningChannels.findIndex(c => c === channelId)]
            return void this.unregisterChannel(channelId)
        } catch (error) {
            console.log(error)
        }
    }

    public loaded(): void {
        console.log('info', '[MODULE] Loaded TempVCHandler')
        return void 0;
    }
}
