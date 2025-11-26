import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [{ name: 'epic_exchange', type: 'topic' }],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [EpicController],
  providers: [EpicService],
  exports: [EpicService],
})
export class EpicModule {}