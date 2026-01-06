import { Module } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  DISCUSSION_EXCHANGE,
  EVENTS_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message.schema';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Discussion, DiscussionSchema } from './schema/discussion.schema';
@Module({
  imports: [
    ClientConfigModule,
    MongooseModule.forRootAsync({
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        uri: cfg.databaseDiscussionUrl,
        connectTimeoutMS: 3000,
      }),
    }),
    MongooseModule.forFeature([
      {
        name: Discussion.name,
        schema: DiscussionSchema,
      },
      {
        name: Message.name,
        schema: MessageSchema,
      },
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        exchanges: [
          {
            name: EVENTS_EXCHANGE,
            type: 'topic',
          },
          {
            name: DISCUSSION_EXCHANGE,
            type: 'direct'
          },
          {
            name: USER_EXCHANGE,
            type: 'direct'
          }
        ],
        uri: cfg.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService, DiscussionController]
})
export class DiscussionModule { }
