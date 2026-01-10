import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, FILE_EXCHANGE, SEARCH_EXCHANGE, TEAM_EXCHANGE } from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema } from './schema/file.schema';
import { FileService } from './file.service';
import { MinioService } from './minio.service';

@Module({
  imports: [
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: FILE_EXCHANGE,
            type: 'direct',
            options: {
              durable: true,
            },
          }
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true
      })
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ClientConfigService) => ({
        uri: configService.getFileDatabaseUrl()
      }),
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
    }),
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
  ],
  controllers: [FileController],
  providers: [FileService, MinioService],
})
export class FileModule { }
