import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class ClientConfigService {
    constructor(private config: ConfigService) { }

    getUserClientPort(): number {
        return this.config.get<number>('USER_CLIENT_PORT', 3001);
    }

    getAuthClientPort(): number {
        return this.config.get<number>('AUTH_CLIENT_PORT', 3002);
    }

    get userClientOptions(): ClientOptions {
        return {
            transport: Transport.TCP,
            options: {
                port: this.getUserClientPort()
            }
        }
    }

    get authClientOptions(): ClientOptions {
        return {
            transport: Transport.TCP,
            options: {
                port: this.getAuthClientPort()
            }
        }
    }
}
