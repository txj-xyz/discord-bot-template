import * as fs from 'fs';

/**
 * chr: may remove this later
 * Export a default configmap variable object
 */
export const ConfigSchemaDefaults = {
    "TEST_KEY": true,
}

/**
 * Live configuration settings for each feature
 * @returns Map<string, boolean>
 */
export class ConfigMap extends Map<string, boolean> {
    private file: string;

    constructor(filePath: string) {
        super();
        this.file = filePath;
        this.load();
    }

    public toJSON(): Record<string, boolean> {
        return Object.fromEntries(this.entries());
    }

    public toHelp(): string[] {
        return Object.entries(this.toJSON()).map(([name, value]) => `${value ? '+' : '-'} ${name} - ${value ? 'enabled' : 'disabled'}`);
    }

    public toSlashCommandOptions(): { name: string; value: string; }[] {
        return Object.entries(this.toJSON()).map(([name, value]) => ({ name: `${name} - ${value.toString().toUpperCase()}`, value: name }));
    }

    /**
     * Toggle ON/OFF a feature throughout the bot live.
     * @param key `config key string to toggle`
     * @returns `boolean`
     */
    public toggle(key: string): boolean {
        const value = super.get(key);
        if (typeof value !== 'boolean') throw new Error(`'${key}' does not exist.`);
        super.set(key, !value);
        this.saveToFile();
        return !value

    }

    /**
     * Create a new configuration
     * @param key `config key string to create`
     * @param value `boolean to set if this feature is ON/OFF`
     * @returns 
     */
    public set(key: string, value: boolean): this {
        if(typeof value !== 'boolean') throw new Error(`'${key}' is not of type 'boolean'`)
        super.set(key, value);
        this.saveToFile();
        return this;
    }

    /**
     * Check an existing flag if its ON/OFF
     * @param key `config key to check`
     * @returns `boolean`
     */
    public check(key: string): boolean {
        const value = super.get(key);
        if (typeof value !== 'boolean') throw new Error(`'${key}' does not exist.`);
        return value;
    }


    /**
     * Load the file requested from the constructor to load config variables
     * @returns `void`
     */
    private load(): void {
        try {
            if (!fs.existsSync(this.file)) return fs.writeFileSync(this.file, JSON.stringify(ConfigSchemaDefaults, null, 4), 'utf-8');
            const data = fs.readFileSync(this.file, 'utf-8');
            const jsonData = JSON.parse(data) as Record<string, boolean>;
            for (const [key, value] of Object.entries(jsonData)) {
                if (typeof value === 'boolean') {
                    this.set(key, value);
                }
            }
        } catch (error) {
            console.error(`Error loading config file: ${(error as Error).stack as string}`);
        }
    }

    /**
     * Save the file and write the changes to disk
     * @returns `void`
     */
    private saveToFile(): void {
        try {
            const jsonData = JSON.stringify(Object.fromEntries(this.entries()), null, 4);
            fs.writeFileSync(this.file, jsonData);
        } catch (error) {
            console.error(`Error saving config file: ${(error as Error).stack as string}`);
        }
    }
}
