import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import {
  AUTH_CLIENT_PORT,
  REDIS_CLIENT_PORT,
  USER_CLIENT_PORT,
} from '@app/contracts/constants';

@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) {}
  /* 
  -------------------------
  ------ USER CLIENT ------
  -------------------------
  */
  getUserClientPort(): number {
    return this.config.get<number>('USER_CLIENT_PORT', USER_CLIENT_PORT);
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
    return this.config.get<number>('AUTH_CLIENT_PORT', AUTH_CLIENT_PORT);
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
    return this.config.get<number>('REDIS_CLIENT_PORT', REDIS_CLIENT_PORT);
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
