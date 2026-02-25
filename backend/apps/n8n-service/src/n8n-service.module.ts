import { Module } from '@nestjs/common';
import { N8nServiceController } from './n8n-service.controller';
import { N8nServiceService } from './n8n-service.service';
import { RmqModule } from '@app/common';
import { N8N_EXCHANGE } from '@app/contracts';
import { HttpModule } from '@nestjs/axios';
import { ClientConfigModule } from '@app/contracts';

@Module({
  imports: [
    RmqModule.register({
      exchanges: [
        {
          name: N8N_EXCHANGE,
          type: 'direct',
        },
      ],
    }),
    HttpModule,
    ClientConfigModule,
  ],
  controllers: [N8nServiceController],
  providers: [N8nServiceService],
})
export class N8nServiceModule { }
