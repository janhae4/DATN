import { forwardRef, Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import {  ClientConfigModule, ClientConfigService, REDIS_CLIENT } from '@app/contracts';
import Redis from 'ioredis';
@Module({
  imports: [
    ClientConfigModule,
    MulterModule,
    forwardRef(() => AuthModule),
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
