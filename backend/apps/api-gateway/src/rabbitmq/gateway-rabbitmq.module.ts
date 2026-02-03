import { Module, Global } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import {
    ClientConfigModule,
    ClientConfigService,
    PROJECT_EXCHANGE,
    LIST_EXCHANGE,
    USER_EXCHANGE,
    AUTH_EXCHANGE,
    DISCUSSION_EXCHANGE,
    EPIC_EXCHANGE,
    TEAM_EXCHANGE,
    NOTIFICATION_EXCHANGE,
    TASK_EXCHANGE,
    SPRINT_EXCHANGE,
    GMAIL_EXCHANGE
} from '@app/contracts';

@Global()
@Module({
    imports: [
        RabbitMQModule.forRootAsync({
            imports: [ClientConfigModule],
            inject: [ClientConfigService],
            useFactory: (config: ClientConfigService) => ({
                uri: config.getRMQUrl(),
                connectionInitOptions: { wait: true, timeout: 20000 },
                exchanges: [
                    { name: PROJECT_EXCHANGE, type: 'direct' },
                    { name: LIST_EXCHANGE, type: 'direct' },
                    { name: USER_EXCHANGE, type: 'direct' },
                    { name: AUTH_EXCHANGE, type: 'direct' },
                    { name: DISCUSSION_EXCHANGE, type: 'direct' },
                    { name: EPIC_EXCHANGE, type: 'direct' },
                    { name: TEAM_EXCHANGE, type: 'direct' },
                    { name: NOTIFICATION_EXCHANGE, type: 'direct' },
                    { name: TASK_EXCHANGE, type: 'direct' },
                    { name: SPRINT_EXCHANGE, type: 'direct' },
                    // { name: GMAIL_EXCHANGE, type: 'topic' },
                ],
            }),
        }),
    ],
    exports: [RabbitMQModule],
})
export class GatewayRabbitMQModule { }
