import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { 
  ClientConfigModule, 
  ClientConfigService, 
  PROJECT_CLIENT, 
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';

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
  controllers: [EpicController],
  providers: [EpicService],
  exports: [EpicService],
})
export class EpicModule {}
