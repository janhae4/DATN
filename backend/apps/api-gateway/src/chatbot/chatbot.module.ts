import { Logger, Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { CHATBOT_EXCHANGE, ClientConfigModule, ClientConfigService, REDIS_CLIENT } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import Redis from 'ioredis';
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
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    {
      provide: REDIS_CLIENT,
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => {
        return new Redis({
          host: config.getRedisHost() || 'localhost',
          port: config.getRedisClientPort() || 6379,
        });
      },
    },
  ],
})
export class ChatbotModule { }
