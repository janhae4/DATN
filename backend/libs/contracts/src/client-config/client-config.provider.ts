import {
  ClientOptions,
  ClientProxy,
  ClientProxyFactory,
} from '@nestjs/microservices';
import { ClientConfigService } from './client-config.service';
import {
  AUTH_CLIENT,
  CHAT_CLIENT,
  CHATBOT_CLIENT,
  EVENT_CLIENT,
  GMAIL_CLIENT,
  INGESTION_CLIENT,
  NOTIFICATION_CLIENT,
  RAG_CLIENT,
  REDIS_CLIENT,
  RESPONSE_CLIENT,
  SOCKET_CLIENT,
  TASK_CLIENT,
  TASK_NER_CLIENT,
  TEAM_CLIENT,
  USER_CLIENT,
  VIDEO_CHAT_CLIENT,
} from '../constants';

export const CLIENT_PROVIDER = {
  USER_CLIENT: {
    name: USER_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientOptions =>
      cfg.userClientOptions as ClientOptions,
  },
  AUTH_CLIENT: {
    name: AUTH_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientOptions =>
      cfg.authClientOptions as ClientOptions,
  },
  REDIS_CLIENT: {
    name: REDIS_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientOptions =>
      cfg.redisClientOptions as ClientOptions,
  },
  NOTIFICATION_CLIENT: {
    name: NOTIFICATION_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientOptions =>
      cfg.notificationClientOptions as ClientOptions,
  },
  TASK_CLIENT: {
    name: TASK_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientOptions =>
      cfg.taskClientOptions as ClientOptions,
  },

  GMAIL_CLIENT: {
    name: GMAIL_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientOptions =>
      cfg.gmailClientOptions as ClientOptions,
  },
};

export const CLIENT_PROXY_PROVIDER = {
  USER_CLIENT: {
    provide: USER_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.userClientOptions as ClientOptions),
  },
  AUTH_CLIENT: {
    provide: AUTH_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.authClientOptions as ClientOptions),
  },
  REDIS_CLIENT: {
    provide: REDIS_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.redisClientOptions as ClientOptions),
  },
  NOTIFICATION_CLIENT: {
    provide: NOTIFICATION_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.notificationClientOptions as ClientOptions),
  },
  TASK_CLIENT: {
    provide: TASK_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.taskClientOptions as ClientOptions),
  },
  TASK_NER_CLIENT: {
    provide: TASK_NER_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.taskNerClientOptions as ClientOptions),
  },

  GMAIL_CLIENT: {
    provide: GMAIL_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.gmailClientOptions as ClientOptions),
  },

  TEAM_CLIENT: {
    provide: TEAM_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.teamClientOptions as ClientOptions),
  },

  VIDEO_CHAT_CLIENT: {
    provide: VIDEO_CHAT_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.videoChatClientOptions as ClientOptions),
  },

  CHATBOT_CLIENT: {
    provide: CHATBOT_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.chatbotClientOptions as ClientOptions),
  },

  RAG_CLIENT: {
    provide: RAG_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.ragClientOptions as ClientOptions),
  },

  INGESTION_CLIENT: {
    provide: INGESTION_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.ingestionClientOptions as ClientOptions),
  },

  RESPONSE_CLIENT: {
    provide: RESPONSE_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.responseClientOptions as ClientOptions),
  },

  SOCKET_CLIENT: {
    provide: SOCKET_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.socketClientOptions as ClientOptions),
  },

  CHAT_CLIENT: {
    provide: CHAT_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.chatClientOptions as ClientOptions),
  },

  EVENT_CLIENT: {
    provide: EVENT_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.eventClientOptions as ClientOptions),
  }
};

