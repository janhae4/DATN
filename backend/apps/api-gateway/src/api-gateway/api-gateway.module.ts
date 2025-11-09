import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
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
import { StatusModule } from '../status/status.module';
import { SprintModule } from '../sprint/sprint.module';
import { EpicModule } from '../epic/epic.module';
import { TaskModule } from '../task/task.module';
import { ProjectMemberModule } from '../project-member/project-member.module';

@Module({
  imports: [
    AuthModule,
    TeamModule,
    ChatbotModule,
    NotificationModule,
    UserModule,
    DiscussionModule,
    FileModule,
    LabelModule,
    StatusModule,
    SprintModule,
    EpicModule,
    TaskModule,
    ProjectModule,
    ProjectMemberModule,
    WebhooksModule
  ],
  controllers: [ApiGatewayController],
  providers: [RpcErrorToHttpFilter, ApiGatewayService],
})
export class ApiGatewayModule { }
