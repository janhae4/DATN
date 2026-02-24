import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, SEARCH_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register(),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchController],
})
export class SearchModule { }
