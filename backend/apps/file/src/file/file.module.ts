import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, FILE_EXCHANGE, SEARCH_EXCHANGE, TEAM_EXCHANGE } from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema } from './schema/file.schema';
import { FileService } from './file.service';
import { MinioService } from './minio.service';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        { name: FILE_EXCHANGE, type: 'topic' },
      ],
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
