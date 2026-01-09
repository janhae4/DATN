import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { GatewayRabbitMQModule } from '../rabbitmq/gateway-rabbitmq.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { NotificationModule } from '../notification/notification.module';
import { RpcErrorToHttpFilter } from '../common/filter/rpc-to-http.filter';
import { FileModule } from '../file/file.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { DiscussionModule } from '../dicussion/discussion.module';
import { ProjectModule } from '../project/project.module';
import { LabelModule } from '../label/label.module';
import { ListModule } from '../list/list.module';
import { SprintModule } from '../sprint/sprint.module';
import { EpicModule } from '../epic/epic.module';
import { TaskModule } from '../task/task.module';
import { CalendarModule } from '../calendar/calendar.module';
import { VideoChatModule } from '../video-chat/video-chat.module';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [
    ClientConfigModule,
    GatewayRabbitMQModule,
    AuthModule,
    TeamModule,
    ChatbotModule,
    NotificationModule,
    UserModule,
    DiscussionModule,
    FileModule,
    LabelModule,
    ListModule,
    SprintModule,
    EpicModule,
    TaskModule,
    ProjectModule,
    CalendarModule,
    WebhooksModule,
    VideoChatModule,
    GmailModule
  ],
  controllers: [ApiGatewayController],
  providers: [RpcErrorToHttpFilter, ApiGatewayService],
})
export class ApiGatewayModule { }
