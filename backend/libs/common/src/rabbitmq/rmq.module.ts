import { DynamicModule, Global, Module } from '@nestjs/common';
import { RabbitMQModule, RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';
import {
    ClientConfigModule,
    ClientConfigService,
    EVENTS_EXCHANGE,
    TEAM_EXCHANGE,
    AUTH_EXCHANGE,
    DISCUSSION_EXCHANGE,
    USER_EXCHANGE,
    REDIS_EXCHANGE,
    GMAIL_EXCHANGE,
    NOTIFICATION_EXCHANGE,
    SOCKET_EXCHANGE,
    TASK_EXCHANGE,
    VIDEO_CHAT_EXCHANGE,
    LABEL_EXCHANGE,
    SEARCH_EXCHANGE,
    RAG_EXCHANGE,
    INGESTION_EXCHANGE,
    CHATBOT_EXCHANGE,
    DIRECT_EXCHANGE,
    TOPIC_EXCHANGE,
    FILE_EXCHANGE,
    PROJECT_EXCHANGE,
    CALENDAR_EXCHANGE,
    TEST_EXCHANGE,
    SPRINT_EXCHANGE,
    EPIC_EXCHANGE,
    LIST_EXCHANGE
} from '@app/contracts';
import { RmqClientService } from './rmq.service';
import { customErrorHandler } from '../utils/custom-handler-error';
import { ClsModule, ClsService } from 'nestjs-cls';

interface RmqModuleOptions {
    exchanges?: RabbitMQExchangeConfig[];
}

const ALL_EXCHANGES: RabbitMQExchangeConfig[] = [
    { name: EVENTS_EXCHANGE, type: 'topic' },
    { name: TEAM_EXCHANGE, type: 'direct' },
    { name: AUTH_EXCHANGE, type: 'direct' },
    { name: DISCUSSION_EXCHANGE, type: 'direct' },
    { name: USER_EXCHANGE, type: 'direct' },
    { name: REDIS_EXCHANGE, type: 'direct' },
    { name: GMAIL_EXCHANGE, type: 'direct' },
    { name: NOTIFICATION_EXCHANGE, type: 'direct' },
    { name: SOCKET_EXCHANGE, type: 'direct' },
    { name: TASK_EXCHANGE, type: 'direct' },
    { name: VIDEO_CHAT_EXCHANGE, type: 'direct' },
    { name: LABEL_EXCHANGE, type: 'direct' },
    { name: SEARCH_EXCHANGE, type: 'direct' },
    { name: RAG_EXCHANGE, type: 'direct' },
    { name: INGESTION_EXCHANGE, type: 'direct' },
    { name: CHATBOT_EXCHANGE, type: 'direct' },
    { name: DIRECT_EXCHANGE, type: 'direct' },
    { name: TOPIC_EXCHANGE, type: 'topic' },
    { name: FILE_EXCHANGE, type: 'direct' },
    { name: PROJECT_EXCHANGE, type: 'direct' },
    { name: CALENDAR_EXCHANGE, type: 'direct' },
    { name: TEST_EXCHANGE, type: 'direct' },
    { name: SPRINT_EXCHANGE, type: 'direct' },
    { name: EPIC_EXCHANGE, type: 'direct' },
    { name: LIST_EXCHANGE, type: 'direct' },
];

@Global()
@Module({
    providers: [RmqClientService],
    exports: [RmqClientService]
})
export class RmqModule {
    static register({ exchanges = [] }: RmqModuleOptions = {}): DynamicModule {
        return {
            module: RmqModule,
            imports: [
                RabbitMQModule.forRootAsync({
                    imports: [ClientConfigModule],
                    inject: [ClientConfigService],
                    useFactory: (config: ClientConfigService) => ({
                        exchanges: [
                            ...ALL_EXCHANGES,
                            ...exchanges,
                        ],
                        uri: config.getRMQUrl() || 'amqp://guest:guest@localhost:5672',
                        connectionInitOptions: { wait: false, timeout: 3000 },
                        connectionManagerOptions: {
                            heartbeatIntervalInSeconds: 60,
                            reconnectTimeInSeconds: 5,
                        },
                        channels: {
                            'default': {
                                prefetchCount: 1,
                                default: true,
                            },
                        },
                        enableControllerDiscovery: true,
                        defaultRpcErrorHandler: customErrorHandler
                    }),
                }),
            ],
            providers: [RmqClientService],
            exports: [RabbitMQModule, RmqClientService],
        };
    }
}