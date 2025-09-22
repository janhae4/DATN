import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) {}
  /* 
  -------------------------
  ------ USER CLIENT ------
  -------------------------
  */
  getUserClientPort(): number {
    return this.config.get<number>('USER_CLIENT_PORT', 3001);
  }
  get userClientOptions(): ClientOptions {
    return {
      transport: Transport.TCP,
      options: {
        port: this.getUserClientPort(),
      },
    };
  }

  /* 
  -------------------------
  ------ AUTH CLIENT ------
  -------------------------
  */
  getAuthClientPort(): number {
    return this.config.get<number>('AUTH_CLIENT_PORT', 3002);
  }
  get authClientOptions(): ClientOptions {
    return {
      transport: Transport.TCP,
      options: {
        port: this.getAuthClientPort(),
      },
    };
  }

  /* 
  -------------------------
  ------ REDIS CLIENT ------
  -------------------------
  */
  getRedisClientPort(): number {
    return this.config.get<number>('REDIS_CLIENT_PORT', 6379);
  }
  get redisClientOptions(): ClientOptions {
    return {
      transport: Transport.REDIS,
      options: {
        port: this.getRedisClientPort(),
      },
    };
  }
}
