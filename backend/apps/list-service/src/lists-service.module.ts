import { Module } from '@nestjs/common';
import { ListModule } from './list/list.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService} from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from '@app/contracts/list/list/list.entity';
@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseListUrl,
        entities: [List],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([List]),
    ListModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: 'status_exchange',
            type: 'topic',
          },
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
})
export class ListServiceModule {}
