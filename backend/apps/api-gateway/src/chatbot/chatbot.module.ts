import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { CHATBOT_EXCHANGE, CLIENT_PROXY_PROVIDER, ClientConfigModule, ClientConfigService } from '@app/contracts';
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
  controllers: [ChatbotController],
  providers: [ChatbotService, CLIENT_PROXY_PROVIDER.CHATBOT_CLIENT],
})
export class ChatbotModule { }
