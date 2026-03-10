import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { ClientConfigModule, ClientConfigService, FILE_EXCHANGE } from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema, File } from './schema/file.schema';
import { FileService } from './file.service';
import { RmqModule } from '@app/common';
import { RedisServiceModule } from '@app/redis-service';
import { MinioService } from '@app/minio';
import { ScheduleModule } from '@nestjs/schedule';
import { FileCronService } from './file-cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ClientConfigModule,
    RmqModule.register(),
    MongooseModule.forRootAsync({
      useFactory: (configService: ClientConfigService) => ({
        uri: configService.getFileDatabaseUrl()
      }),
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
    }),
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    RedisServiceModule
  ],
  controllers: [FileController],
  providers: [FileService, MinioService, FileCronService],
})

export class FileModule { }
