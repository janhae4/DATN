import { ClientConfigService, EVENTS_EXCHANGE } from "@app/contracts";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";
import { Module } from "@nestjs/common";

@Module({
    imports: [
        RabbitMQModule.forRootAsync({
            inject:[ClientConfigService],
            useFactory: (cfg: ClientConfigService) => ({
                exchanges: [
                    {
                        name: EVENTS_EXCHANGE,
                        type: "fanout"
                    }
                ],
                uri: cfg.getRMQUrl(),
            })
        })
    ],
    exports: [RabbitMQModule]
})
export class RMQModule {}