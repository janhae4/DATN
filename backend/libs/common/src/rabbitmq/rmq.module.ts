import { DynamicModule, Global, Module } from '@nestjs/common';
import { RabbitMQModule, RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { RmqClientService } from './rmq.service';

interface RmqModuleOptions {
    exchanges?: RabbitMQExchangeConfig[];
}
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
                            ...exchanges,
                        ],
                        uri: config.getRMQUrl() || 'amqp://guest:guest@localhost:5672',
                        connectionInitOptions: { wait: true },
                        enableControllerDiscovery: true
                    }),
                }),
            ],
            providers: [RmqClientService],
            exports: [RabbitMQModule, RmqClientService],
        };
    }
}