import { BadRequestException, ClientConfigService, ForbiddenException, NotFoundException } from '@app/contracts';
import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import path from 'path';
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private configService: ClientConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: configService.getEndPointMinio(),
      port: configService.getPortMinio(),
      useSSL: configService.getUseSSLMinio(),
      accessKey: configService.getAccessKeyMinio(),
      secretKey: configService.getSecretKeyMinio(),
    });

    this.bucketName = configService.getBucketName();
    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const bucketExist = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExist) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket ${this.bucketName} created`);
      }
    } catch (err) {
      this.logger.error(`Error creating bucket ${this.bucketName}: ${err}`);
    }
  }

  public async uploadFile(file: Express.Multer.File, userId: string) {
    const fileName = `${userId}_${Date.now()}_${file.originalname}`;

    const metaData = {
      'Content-Type': file.mimetype,
    };

    try {
      const fileBuffer = Buffer.from(file.buffer);
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        fileBuffer,
        file.size,
        metaData,
      );
      this.logger.log(`File ${fileName} uploaded successfully`);
      return fileName;
    } catch (err) {
      this.logger.error(`Error uploading file ${fileName}: ${err}`);
      throw new BadRequestException('Error uploading file');
    }
  }

  public async getFilesByUserId(userId: string): Promise<string[]> {
    const files: string[] = [];
    const prefix = `${userId}_`;
    try {
      const stream = this.minioClient.listObjectsV2(
        this.bucketName,
        prefix,
        true,
      );

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });

        stream.on('error', (err) => {
          this.logger.error(`Lỗi khi liệt kê file cho user ${userId}: ${err}`);
          reject(new BadRequestException('Lỗi khi lấy danh sách file'));
        });

        stream.on('end', () => {
          this.logger.log(`Tìm thấy ${files.length} file cho user ${userId}`);
          resolve(files);
        });
      });
    } catch (err) {
      this.logger.error(`Lỗi khi stream file: ${err}`);
      throw new BadRequestException('Lỗi hệ thống khi lấy file');
    }
  }

  public async deleteFile(userId: string, fileName: string) {
    this.logger.log(`Attempting to delete file...`);
    if (!fileName || !fileName.startsWith(`${userId}_`)) {
      this.logger.warn(
        `User ${userId} attempted to delete unauthorized file ${fileName}`,
      );
      throw new ForbiddenException('Access denied to delete this file');
    }

    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File ${fileName} deleted successfully`);
      return { message: 'File deleted successfully' };
    } catch (err) {
      this.logger.error(`Error deleting file ${fileName}: ${err}`);
      throw new BadRequestException('Error deleting file');
    }
  }

  async getFile(userId: string, fileId: string) {
    if (!fileId || !fileId.startsWith(`${userId}_`)) {
      this.logger.warn(
        `User ${userId} attempted to access unauthorized file ${fileId}`,
      );
      throw new ForbiddenException('Access denied to this file');
    }

    try {
      await this.minioClient.statObject(this.bucketName, fileId);

      this.logger.log(`Getting file stream for ${fileId}`);
      const fileStream = await this.minioClient.getObject(
        this.bucketName,
        fileId,
      );
      return fileStream;
    } catch (err: any) {
      if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
        this.logger.error(`File not found: ${fileId}`);
        throw new NotFoundException('File not found');
      }
      this.logger.error(`Error getting file ${fileId}: ${err}`);
      throw new BadRequestException('Error getting file');
    }
  }

  async updateFile(
    file: Express.Multer.File,
    userId: string,
    fileId: string,
  ): Promise<{ fileId: string; etag: string }> {
    if (!fileId || !fileId.startsWith(`${userId}_`)) {
      this.logger.warn(
        `User ${userId} attempted to update unauthorized file ${fileId}`,
      );
      throw new ForbiddenException('Access denied to update this file');
    }

    try {
      await this.minioClient.statObject(this.bucketName, fileId);
    } catch (err: any) {
      if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
        this.logger.error(`Cannot update non-existent file: ${fileId}`);
        throw new NotFoundException('File to update not found');
      }
      throw err;
    }

    const metaData = {
      'Content-Type': file.mimetype,
    };
    const fileBuffer = Buffer.from(file.buffer);

    try {
      const result = await this.minioClient.putObject(
        this.bucketName,
        fileId,
        fileBuffer,
        file.size,
        metaData,
      );
      this.logger.log(`File ${fileId} updated successfully. ETag: ${result.etag}`);
      return { fileId: fileId, etag: result.etag };
    } catch (err) {
      this.logger.error(`Error updating file ${fileId}: ${err}`);
      throw new BadRequestException('Error updating file');
    }
  }

  async renameFile(userId: string, oldFileId: string, newName: string) {
    if (!oldFileId || !oldFileId.startsWith(`${userId}_`)) {
      this.logger.warn(`User ${userId} attempted to rename unauthorized file ${oldFileId}`);
      throw new ForbiddenException('Access denied');
    }

    const extension = path.extname(oldFileId);
    const firstUnderscore = oldFileId.indexOf('_');
    const secondUnderscore = oldFileId.indexOf('_', firstUnderscore + 1);

    if (secondUnderscore === -1) {
      this.logger.error(`Invalid file ID format for rename: ${oldFileId}`);
      throw new BadRequestException('Invalid original file ID format');
    }

    const prefix = oldFileId.substring(0, secondUnderscore + 1);

    const newBaseName = path.basename(newName, path.extname(newName));

    if (!newBaseName.trim()) {
      throw new BadRequestException('New file name cannot be empty');
    }

    const newFileId = `${prefix}${newBaseName}${extension}`;

    this.logger.log(`Rename request: ${oldFileId} -> ${newFileId}`);

    if (newFileId === oldFileId) {
      this.logger.log(`New name is the same as the old name for ${oldFileId}. No rename needed.`);
      return oldFileId;
    }
    try {
      await this.minioClient.copyObject(
        this.bucketName,
        newFileId,
        `/${this.bucketName}/${oldFileId}`,
        new Minio.CopyConditions()
      );
      this.logger.log(`File copied from ${oldFileId} to ${newFileId}`);

      await this.minioClient.removeObject(this.bucketName, oldFileId);
      this.logger.log(`Original file ${oldFileId} deleted after rename`);
      return newFileId;
    } catch (err) {
      this.logger.error(`Error renaming file ${oldFileId} to ${newFileId}: ${err}`);

      try {
        await this.minioClient.statObject(this.bucketName, newFileId);
        await this.minioClient.removeObject(this.bucketName, newFileId);
        this.logger.warn(`Cleanup: Removed partially copied file ${newFileId}`);
      } catch (cleanupErr: any) {
        if (cleanupErr.code !== 'NoSuchKey' && cleanupErr.code !== 'NotFound') {
          this.logger.error(`Error cleaning up copied file ${newFileId}: ${cleanupErr}`);
        }
      }
      throw new BadRequestException('Error renaming file');
    }
  }
}