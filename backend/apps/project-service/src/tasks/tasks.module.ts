import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';

@Module({
  imports: [
    PrismaModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE_CLIENT',
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (configService: ClientConfigService) => 
          configService.notificationClientOptions,
      },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
