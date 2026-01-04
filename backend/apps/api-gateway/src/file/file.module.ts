import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, FILE_EXCHANGE } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        uri: config.getRMQUrl(),
        exchanges: [
          { name: FILE_EXCHANGE, type: 'direct', options: { durable: true } },
        ],
      })
    })
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule { }
