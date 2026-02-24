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
import { RmqModule } from '@app/common';
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
    RmqModule.register(),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService]
})
export class DiscussionModule { }
