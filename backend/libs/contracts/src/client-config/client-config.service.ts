import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';
@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) { }

  /*
  DATABASE
  */
  get databaseTeamUrl(): string {
    return this.config.get<string>(
      'DATABASE_TEAM_URL',
      'mongodb://localhost:27017/team',
    );
  }

  get videoChatUrl(): string {
    return this.config.get<string>(
      'DATABASE_VIDEO_CHAT_URL',
      'postgresql://postgres:postgres@localhost:5432/call',
    );
  }

  get databaseDiscussionUrl(): string {
    return this.config.get<string>(
      'DATABASE_DISCUSSION_URL',
      'mongodb://localhost:27017/discussion',
    );
  }


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

  getUserQueue(): string {
    return this.config.get<string>('USER_QUEUE', 'user_service_queue');
  }
  get userClientOptions(): any {
    console.log('User port: ', this.getUserClientPort());
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getUserQueue(),
        queueOptions: { durable: true },
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
  ----- TEAM CLIENT -------
  -------------------------
  */
  getTeamClientPort(): number {
    return this.config.get<number>('TEAM_CLIENT_PORT', 3003);
  }
  getTeamQueue(): string {
    return this.config.get<string>('TEAM_QUEUE', 'team_service_queue');
  }
  get teamClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getTeamQueue(),
        queueOptions: { durable: true },
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

  /*
  -------------------------
  ------ VIDEO CHAT CLIENT -----
  -------------------------
  */
  getVideoChatClientPort(): number {
    return this.config.get<number>('VIDEO_CHAT_CLIENT_PORT', 3004);
  }
  getVideoChatQueue(): string {
    return this.config.get<string>(
      'VIDEO_CHAT_QUEUE',
      'video_chat_service_queue',
    );
  }
  get videoChatClientOptions(): any {
    console.log('Video chat port: ', this.getVideoChatClientPort());
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getVideoChatQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  ----- CHATBOT CLIENT ----
  -------------------------
  */

  getChatbotDatabaseURL(): string {
    return this.config.get<string>(
      'CHATBOT_DATABASE_URL',
      'mongodb://localhost:27017',
    );
  }

  getChatbotClientPort(): number {
    return this.config.get<number>('CHATBOT_CLIENT_PORT', 3006);
  }
  getChatbotQueue(): string {
    return this.config.get<string>('CHATBOT_QUEUE', 'chatbot_service_queue');
  }
  get chatbotClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getChatbotQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  ------ RAG CLIENT -----
  -------------------------
  */
  getRagQueue(): string {
    return this.config.get<string>('RAG_QUEUE', 'rag_queue');
  }
  get ragClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getRagQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  --- INGESTION CLIENT ---
  -------------------------
  */
  getIngestionQueue(): string {
    return this.config.get<string>('INGESTION_QUEUE', 'ingestion_queue');
  }
  get ingestionClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getIngestionQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  --- RESPONSE CLIENT -----
  -------------------------
  */
  getResponseQueue(): string {
    return this.config.get<string>('RESPONSE_QUEUE', 'response_queue');
  }
  get responseClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getResponseQueue(),
        queueOptions: { durable: false },
      },
    };
  }

  /*
  -------------------------
  ------ MINIO CLIENT -----
  -------------------------
  */

  getEndPointMinio(): string {
    return this.config.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
  }

  getPortMinio(): number {
    return this.config.get<number>('MINIO_PORT', 9000);
  }

  getUseSSLMinio(): boolean {
    const envValue = this.config.get<string>('MINIO_USE_SSL', 'false');
    return envValue === 'true';
  }

  getAccessKeyMinio(): string {
    return this.config.get<string>('MINIO_ACCESS_KEY', 'minio');
  }

  getSecretKeyMinio(): string {
    return this.config.get<string>('MINIO_SECRET_KEY', 'minio123');
  }

  getBucketName(): string {
    return this.config.get<string>('MINIO_BUCKET_NAME', 'documents');
  }

  getMinioPublicWebHook(): string {
    return this.config.get<string>(
      'MINIO_PUBLIC_WEBHOOK',
      'http://localhost:3000/files/hooks/upload-completed',
    );
  }

  /*
  -------------
  --- SOCKET --
  -------------
  */
  getSocketPort(): number {
    return this.config.get<number>('SOCKET_PORT', 4001);
  }

  getSocketQueue(): string {
    return this.config.get<string>('SOCKET_QUEUE', 'socket_queue');
  }

  get socketClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getSocketQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  --------------
  ---- CHAT ----
  --------------
  */
  getChatDatabaseUrl(): string {
    return this.config.get<string>(
      'DATABASE_CHAT_URL',
      'mongodb://localhost:27017/chat',
    );
  }

  getChatQueue(): string {
    return this.config.get<string>('CHAT_QUEUE', 'chat_queue');
  }

  get chatClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getChatQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
--------------
--- SEARCH ---
--------------
*/
  getSearchHost(): string {
    return this.config.get<string>(
      'SEARCH_HOST_URL',
      'http://localhost:7700/',
    );
  }

  getSearchApiKey(): string {
    return this.config.get<string>(
      'SEARCH_API_KEY',
      'masterkey',
    );
  }

  get searchClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: 'search_queue',
        queueOptions: { durable: true },
      },
    };
  }

  /*
--------------
--- FILE ---
--------------
*/

  getFileDatabaseUrl(): string {
    return this.config.get<string>(
      'DATABASE_FILE_URL',
      'mongodb://localhost:27017/file',
    );
  }
}
