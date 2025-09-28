import { ClientOptions, ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from './client-config.service';
import { AUTH_CLIENT, NOTIFICATION_CLIENT, REDIS_CLIENT, USER_CLIENT } from '../constants';

export const CLIENT_PROVIDER = {
    "USER_CLIENT": {
        name: USER_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientOptions => cfg.userClientOptions,
    },
    "AUTH_CLIENT": {
        name: AUTH_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientOptions => cfg.authClientOptions,
    },
    "REDIS_CLIENT": {
        name: REDIS_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientOptions => cfg.redisClientOptions
    },
    "NOTIFICATION_CLIENT": {
        name: NOTIFICATION_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientOptions => cfg.notificationClientOptions,
    },
}


export const CLIENT_PROXY_PROVIDER = {
    "USER_CLIENT": {
        provide: USER_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientProxy => ClientProxyFactory.create(cfg.userClientOptions),
    },
    "AUTH_CLIENT": {
        provide: AUTH_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientProxy => ClientProxyFactory.create(cfg.authClientOptions),
    },
    "REDIS_CLIENT": {
        provide: REDIS_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientProxy => ClientProxyFactory.create(cfg.redisClientOptions)
    },
    "NOTIFICATION_CLIENT": {
        provide: NOTIFICATION_CLIENT,
        inject: [ClientConfigService],
        useFactory: (cfg: ClientConfigService): ClientProxy => ClientProxyFactory.create(cfg.notificationClientOptions)
    },
}