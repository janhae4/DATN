import {
  ClientOptions,
  ClientProxy,
  ClientProxyFactory,
} from '@nestjs/microservices';
import { ClientConfigService } from './client-config.service';
import {
  AUTH_CLIENT,
  GMAIL_CLIENT,
  NOTIFICATION_CLIENT,
  REDIS_CLIENT,
  TASK_CLIENT,
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

  GMAIL_CLIENT: {
    provide: GMAIL_CLIENT,
    inject: [ClientConfigService],
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.gmailClientOptions as ClientOptions),
  },

  VIDEO_CHAT_CLIENT: {
    provide: VIDEO_CHAT_CLIENT,
    inject: [ClientConfigService] ,
    useFactory: (cfg: ClientConfigService): ClientProxy =>
      ClientProxyFactory.create(cfg.videoChatClientOptions as ClientOptions),
  },
};
