import { Module } from '@nestjs/common';
import { ListController } from './list.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  LIST_EXCHANGE,
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '@nestjs/microservices';
import { ListService } from './list.service';

@Module({
  imports: [
    AuthModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: LIST_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.listClientOptions,
      },
    ]),
  ],

  controllers: [ListController],
  providers: [ListService],
})
export class ListModule {}