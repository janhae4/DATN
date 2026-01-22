import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { ClientConfigModule, ClientConfigService, FILE_EXCHANGE } from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema, File } from './schema/file.schema';
import { FileService } from './file.service';
import { MinioService } from './minio.service';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        { name: FILE_EXCHANGE, type: 'direct' },
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
