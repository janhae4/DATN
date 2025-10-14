import { Module } from '@nestjs/common';
import { ClientConfigService } from './client-config.service';
import { ConfigModule } from '@nestjs/config';
import * as joi from 'joi';
import { Global } from '@nestjs/common';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: joi.object({
        USER_CLIENT_PORT: joi.number().default(3001),
        AUTH_CLIENT_PORT: joi.number().default(3002),
        REDIS_CLIENT_PORT: joi.number().default(6379),
        TASK_CLIENT_PORT: joi.number().default(3003),
        VIDEO_CHAT_CLIENT_PORT: joi.number().default(3004),
        NOTIFICATION_CLIENT_PORT: joi.number().default(4001),
        RMQ_URL: joi.string().default('amqp://localhost:5672'),
        REDIS_QUEUE: joi.string().default('redis_service_queue'),
        TASK_QUEUE: joi.string().default('task_service_queue'),
        NOTIFICATION_QUEUE: joi.string().default('notification_service_queue'),
        GOOGLE_CLIENT_ID: joi.string().required(),
        GOOGLE_CLIENT_SECRET: joi.string().required(),
        GOOGLE_CALLBACK_URL: joi.string().uri().required(),
        JWT_ACCESS_SECRET: joi.string().required(),
        SMTP_TRANSPORT: joi.string().required(),
        SMTP_FROM: joi.string().required(),
      }),
    }),
  ],
  providers: [ClientConfigService],
  exports: [ClientConfigService],
})
export class ClientConfigModule {}
