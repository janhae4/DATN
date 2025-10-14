import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) {}
  /*  
  -------------------------
  --------- SMTP  ---------
  -------------------------
  */
  getSMTPTransport(): string {
    return this.config.get<string>(
      'SMTP_TRANSPORT',
      'smtps://user@domain.com:pass@smtp.domain.com',
    );
  }

  getSMTPFrom(): string {
    return this.config.get<string>('SMTP_FROM', 'user@domain.com');
  }

  /* 
  -------------------------
  --------- JWT  ----------
  -------------------------
  */

  getJWTSecret(): string {
    return this.config.get<string>('JWT_ACCESS_SECRET', 'default_jwt_secret');
  }

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

  /*
  -------------------------
  ------ TASK CLIENT ------
  -------------------------
  */
  getTaskClientPort(): number {
    return this.config.get<number>('TASK_CLIENT_PORT', 5001);
  }
  getTaskQueue(): string {
    return this.config.get<string>('TASK_QUEUE', 'task_service_queue');
  }

  getTaskNerQueue(): string {
    return this.config.get<string>('TASK_NER_QUEUE', 'process_nlp');
  }

  get taskClientOptions(): any {
    console.log('Task port: ', this.getTaskClientPort());
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getTaskQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  get taskNerClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getTaskNerQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  ------ GMAIL CLIENT -----
  -------------------------
  */
  getGmailClientPort(): number {
    return this.config.get<number>('GMAIL_CLIENT_PORT', 3005);
  }
  getGmailQueue(): string {
    return this.config.get<string>('GMAIL_QUEUE', 'gmail_service_queue');
  }
  get gmailClientOptions(): any {
    console.log('Gmail port: ', this.getGmailClientPort());
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getGmailQueue(),
        queueOptions: { durable: true },
      },
    };
  }
}
