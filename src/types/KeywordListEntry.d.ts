
export type KeywordListEntry = {
    /**
     * Whether the keyword is enabled or not.
     */
    enabled: boolean;

    /**
     * The words in messages to look for. This can be anything matching a string.
     */
    keywords: string[];

    /**
     * This is a `string` reply from the bot once they `keywords` is matched.
     */
    reply: string;

    /**
     * An optional `number` that can be specified to remove the bot `reply` after a certain period of time in `seconds`.
     */
    delete_after?: number;

    /**
     * `any` = must be in the message content
     *
     * `exact` = must be exact message content match
     */
    match_type: 'any' | 'exact';

    /**
     * `direct` = reply to the user
     *
     * `channel` = reply in the matched channel
     *
     * `react` = react to the message with an emoji (Must be snowflake)
     */
    reply_type?: 'direct' | 'channel' | 'react';
};
