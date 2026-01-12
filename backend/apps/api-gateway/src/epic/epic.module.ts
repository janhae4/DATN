import { Module } from '@nestjs/common';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';
import { AuthModule } from '../auth/auth.module';
import { ClientConfigModule, ClientConfigService, EPIC_EXCHANGE, PROJECT_EXCHANGE } from '@app/contracts';
import { ClientsModule } from '@nestjs/microservices';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    AuthModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: EPIC_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.epicClientOptions,
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

  controllers: [EpicController],
  providers: [EpicService],
  exports: [EpicService],
})
export class EpicModule { }