import { Module } from '@nestjs/common';
import { ListModule } from './list/list.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, LIST_EXCHANGE } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from '@app/contracts/list/list/list.entity';
import { RmqModule } from '@app/common';
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
    RmqModule.register({
      exchanges: [{ name: LIST_EXCHANGE, type: 'direct' }]
    })
  ],
})
export class ListServiceModule { }
