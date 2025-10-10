import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { TasksModule } from './tasks/tasks.module';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [TasksModule, EmailsModule],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
