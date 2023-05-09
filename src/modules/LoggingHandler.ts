import * as winston from 'winston'
import Bot from '../Bot';
import { Console } from 'winston/lib/winston/transports';


export default interface BotLogger extends winston.Logger {
    options: winston.LoggerOptions;
    c: winston.Logger;
}

export default class BotLogger {
    constructor(client: Bot) {
        this.options = {
            level: 'info',
            defaultMeta: {
                service: 'discord-bot-service'
            },
            transports: [
                new winston.transports.File({ filename: client.production ? `logs/prod_error.log` : `logs/dev_error.log`, level: 'error' }),
                new winston.transports.File({ filename: client.production ? `logs/dev.log` : `logs/production.log` }),
            ],
        }
        
        this.c = winston.createLogger(this.options);
        
        if (!client.production) {
            this.c.add(
                new Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            )
        }
    }
}