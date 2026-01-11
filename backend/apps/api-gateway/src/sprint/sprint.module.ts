import { Module } from '@nestjs/common';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import {
  ClientConfigModule,
  ClientConfigService,
  PROJECT_EXCHANGE,
  SPRINT_EXCHANGE,
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
// THÊM ClientProvider để khai báo kiểu dữ liệu trả về
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    AuthModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: SPRINT_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.sprintClientOptions,
      },
      {
        name: PROJECT_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.projectClientOptions,
      },
    ]),
    TeamModule,
  ],

  controllers: [SprintController],
  providers: [SprintService],
})
export class SprintModule { }