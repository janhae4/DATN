import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) {}

  /* 
  -------------------------
  --------- RMQ  ----------
  -------------------------
  */
  getRMQUrl(): string {
    return this.config.get<string>('RMQ_URL', 'amqp://localhost:5672');
  }

  /* 
  -------------------------
  ------ USER CLIENT ------
  -------------------------
  */
  getUserClientPort(): number {
    return this.config.get<number>('USER_CLIENT_PORT', 3001);
  }
  get userClientOptions(): any {
    console.log('User port: ', this.getUserClientPort());
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
  get authClientOptions(): any {
    console.log('Auth port: ', this.getAuthClientPort());
    return {
      transport: Transport.TCP,
      options: {
        port: this.getAuthClientPort(),
      },
    };
  }

  /* 
  -------------------------
  ------ REDIS CLIENT -----
  -------------------------
  */
  getRedisClientPort(): number {
    return this.config.get<number>('REDIS_CLIENT_PORT', 6379);
  }
  getRedisQueue(): string {
    return this.config.get<string>('REDIS_QUEUE', 'redis_service_queue');
  }
  get redisClientOptions(): any {
    console.log('Redis port: ', this.getRedisClientPort());
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getRedisQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  -- NOTIFICATION CLIENT --
  -------------------------
  */
  getNotificationClientPort(): number {
    return this.config.get<number>('NOTIFICATION_CLIENT_PORT', 4001);
  }
  getNotificationQueue(): string {
    return this.config.get<string>(
      'NOTIFICATION_QUEUE',
      'notification_service_queue',
    );
  }
  get notificationClientOptions(): any {
    console.log('Notification port: ', this.getNotificationClientPort());
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getNotificationQueue(),
        queueOptions: { durable: true },
      },
    };
  }
}
