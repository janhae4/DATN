import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, SEARCH_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: SEARCH_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: config.getRMQUrl(),
      }),
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchController],
})
export class SearchModule { }
