declare namespace NodeJS {
  export interface ProcessEnv {
    /**
     * An optional Discord Bot Token for running in Development Mode.
     */
    TOKEN_DEV?: string;
    /**
     * Discord Bot Token for running in Production Mode.
     */
    TOKEN: string;

    /**
     * Disable Indomitable Sharding Util
     */
    NO_SHARDING: boolean;
  }
}