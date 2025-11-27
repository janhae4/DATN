import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  PROJECT_EXCHANGE,
  LIST_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
// THÊM ClientProvider để khai báo kiểu dữ liệu trả về
import { ClientsModule } from '@nestjs/microservices';
import { ProjectService } from './project.service';

@Module({
  imports: [
    AuthModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: PROJECT_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.projectClientOptions,
      },
    ]),
  ],

  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}