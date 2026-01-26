import { forwardRef, Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { AuthModule } from '../auth/auth.module';
import { ZipHelper } from './zip.helper';
import { MinioService } from '@app/minio';

@Module({
  imports: [
    forwardRef(() => AuthModule),
  ],
  controllers: [FileController],
  providers: [FileService, MinioService, ZipHelper],
  exports: [FileService],
})
export class FileModule { }
