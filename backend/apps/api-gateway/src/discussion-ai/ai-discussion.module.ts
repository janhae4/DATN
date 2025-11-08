import { Module } from '@nestjs/common';
import { AiDiscussionService } from './ai-discussion.service';
import { AiDiscussionController } from './ai-discussion.controller';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { CHATBOT_EXCHANGE, ClientConfigModule, ClientConfigService } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
@Module({
  imports: [
    ClientConfigModule,
    MulterModule,
    AuthModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: CHATBOT_EXCHANGE,
            type: 'direct',
            options: {
              durable: true,
            },
          },
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      })
    })
  ],
  controllers: [AiDiscussionController],
  providers: [AiDiscussionService],
})
export class AiDiscussionModule { }
