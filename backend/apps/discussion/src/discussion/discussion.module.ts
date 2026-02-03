import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientConfigModule, ClientConfigService, DISCUSSION_EXCHANGE, EVENTS_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';

import { Discussion, DiscussionSchema, Membership, MembershipSchema, ReadReceipt, ReadReceiptSchema } from './schema/discussion.schema';
import { Message, MessageSchema } from './schema/message.schema';
import { PermissionOverride, PermissionOverrideSchema } from './schema/permission.schema';
import { Invite, InviteSchema } from './schema/invite.schema';

import { ServerService } from './services/server.service';
import { ChannelService } from './services/channel.service';
import { MessageService } from './services/message.service';
import { PermissionService } from './services/permission.service';

import { ServerController } from './controllers/server.controller';
import { ChannelController } from './controllers/channel.controller';
import { MessageController } from './controllers/message.controller';
import { PermissionController } from './controllers/permission.controller';

@Module({
  imports: [
    ClientConfigModule,
    MongooseModule.forRootAsync({
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        uri: cfg.databaseDiscussionUrl,
        connectTimeoutMS: 5000,
      }),
    }),
    MongooseModule.forFeature([
      { name: Discussion.name, schema: DiscussionSchema },
      { name: Message.name, schema: MessageSchema },
      { name: PermissionOverride.name, schema: PermissionOverrideSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: ReadReceipt.name, schema: ReadReceiptSchema },
    ]),
    RmqModule.register({
      exchanges: [
        {
          name: DISCUSSION_EXCHANGE,
          type: 'direct'
        },
        {
          name: EVENTS_EXCHANGE,
          type: 'topic'
        }
      ],
    }),
  ],
  controllers: [
    ServerController,
    ChannelController,
    MessageController,
    PermissionController,
  ],
  providers: [
    ServerService,
    ChannelService,
    MessageService,
    PermissionService,
  ],
  exports: [
    ServerService,
    ChannelService,
    MessageService,
    PermissionService,
  ]
})
export class DiscussionModule { }
