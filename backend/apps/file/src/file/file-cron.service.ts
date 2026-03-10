import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileDocument, File } from './schema/file.schema';
import { MinioService } from '@app/minio';
import { FileStatus } from '@app/contracts';

@Injectable()
export class FileCronService {
  private readonly logger = new Logger(FileCronService.name);

  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    private readonly minioService: MinioService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanupPendingFiles() {
    this.logger.log('Starting cleanup of old PENDING files...');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const oldPendingFiles = await this.fileModel.find({
        status: FileStatus.PENDING,
        createdAt: { $lt: twentyFourHoursAgo },
      }).exec();

      if (oldPendingFiles.length === 0) {
        this.logger.log('No old PENDING files found to clean up.');
        return;
      }

      const fileIds = oldPendingFiles.map(file => file._id);
      const storageKeys = oldPendingFiles
        .map(file => file.storageKey)
        .filter(key => key != null);

      this.logger.log(`Found ${oldPendingFiles.length} files to delete.`);

      if (storageKeys.length > 0) {
        await this.minioService.deleteFiles(storageKeys);
        this.logger.log(`Deleted ${storageKeys.length} files from MinIO.`);
      }

      await this.fileModel.deleteMany({ _id: { $in: fileIds } }).exec();
      this.logger.log(`Deleted ${fileIds.length} records from MongoDB.`);

    } catch (error) {
      this.logger.error(`Error during cleanup of old PENDING files: ${error.message}`);
    }
  }
}
