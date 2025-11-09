import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { 
  ClientConfigModule, 
  ClientConfigService, 
  PROJECT_CLIENT,
} from '@app/contracts';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
  imports: [
    ClientConfigModule,
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
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
