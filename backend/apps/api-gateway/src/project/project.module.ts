import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientConfigModule, ClientConfigService, PROJECT_CLIENT } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

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
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}