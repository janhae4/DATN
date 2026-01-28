import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { get } from 'http';
import { string } from 'joi';
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

  get databaseProjectUrl(): string {
    return this.config.get<string>(
      'DATABASE_PROJECT_URL',
      'postgres://postgres:postgres@localhost:5432/project_db',
    );
  }
  get databaseTaskUrl(): string {
    return this.config.get<string>(
      'DATABASE_TASK_URL',
      'postgres://postgres:postgres@localhost:5432/task_db',
    );
  }
  get databaseLabelUrl(): string {
    return this.config.get<string>(
      'DATABASE_LABEL_URL',
      'postgres://postgres:postgres@localhost:5432/label_db',
    );
  }
  get databaseListUrl(): string {
    return this.config.get<string>(
      'DATABASE_LIST_URL',
      'postgres://postgres:postgres@localhost:5432/list_db',
    );
  }
  get databaseEpicUrl(): string {
    return this.config.get<string>(
      'DATABASE_EPIC_URL',
      'postgres://postgres:postgres@localhost:5432/epic_db',
    );
  }
  get databaseSprintUrl(): string {
    return this.config.get<string>(
      'DATABASE_SPRINT_URL',
      'postgres://postgres:postgres@localhost:5432/sprint_db',
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
    console.log('RMQ_URL: ', this.config.get<string>('RMQ_URL', 'amqp://guest:guest@rabbitmq:5672'));
    return this.config.get<string>('RMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
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

  getRedisHost(): string {
    return this.config.get<string>('REDIS_HOST', 'localhost');
  }
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
  --- GOOGLE OAUTH --------
  -------------------------
  */
  getGoogleClientId(): string {
    return this.config.get<string>('GOOGLE_CLIENT_ID', '');
  }

  getGoogleClientSecret(): string {
    return this.config.get<string>('GOOGLE_CLIENT_SECRET', '');
  }

  getGoogleRedirectUri(): string {
    return this.config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/google/callback');
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
    console.log('DATABASE_CHATBOT_URL', this.config.get<string>('DATABASE_CHATBOT_URL', 'mongodb://localhost:27017/chatbot_db?directConnection=true'));
    return this.config.get<string>(
      'DATABASE_CHATBOT_URL',
      'mongodb://localhost:27017/chatbot_db?directConnection=true',
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
    console.log('DATABASE_FILE_URL', this.config.get<string>('DATABASE_FILE_URL', 'mongodb://localhost:27017/file?directConnection=true'));
    return this.config.get<string>(
      'DATABASE_FILE_URL',
      'mongodb://localhost:27017/file?directConnection=true',
    );
  }

  /*
  -------------------------
  ------ PROJECT SERVICE CLIENT -----
  -------------------------
  */
  getProjectClientQueue(): string {
    return this.config.get<string>('PROJECT_QUEUE', 'project_service_queue');
  }
  get projectClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getProjectClientQueue(),
        queueOptions: { durable: true },
      },
    };
  }
  get testClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: "test_queue",
        queueOptions: { durable: true },
      },
    };
  }
  /*
  -------------------------
  ------ CALENDAR SERVICE CLIENT -----
  -------------------------
  */
  getCalendarClientQueue(): string {
    return this.config.get<string>('CALENDAR_QUEUE', 'calendar_service_queue');
  }

  get calendarClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getCalendarClientQueue(),
        queueOptions: { durable: true },
      },
    };
  }


  /*
  -------------------------
  ----- LIST CLIENT -----
  -------------------------
  */
  getListQueue(): string {
    return this.config.get<string>('LIST_QUEUE', 'list_service_queue');
  }
  get listClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getListQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  ------ EPIC CLIENT ----
  -------------------------
  */
  getEpicQueue(): string {
    return this.config.get<string>('EPIC_QUEUE', 'epic_service_queue');
  }
  get epicClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getEpicQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  ----- SPRINT CLIENT -----
  -------------------------
  */
  getSprintQueue(): string {
    return this.config.get<string>('SPRINT_QUEUE', 'sprint_service_queue');
  }
  get sprintClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getSprintQueue(),
        queueOptions: { durable: true },
      },
    };
  }

  /*
  -------------------------
  ----- LABEL CLIENT ----
  -------------------------
  */
  getLabelQueue(): string {
    return this.config.get<string>('LABEL_QUEUE', 'label_service_queue');
  }
  get labelClientOptions(): any {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.getRMQUrl()],
        queue: this.getLabelQueue(),
        queueOptions: { durable: true },
      },
    };
  }
}
