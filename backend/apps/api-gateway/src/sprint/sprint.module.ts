import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { 
  ClientConfigModule, 
  ClientConfigService, 
  PROJECT_CLIENT, 
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: PROJECT_CLIENT,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (configService: ClientConfigService) => (
          configService.projectClientOptions
        )
      }
    ])
  ],
  controllers: [SprintController],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}
