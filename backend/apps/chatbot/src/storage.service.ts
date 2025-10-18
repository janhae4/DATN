import { BadRequestException, ClientConfigService } from '@app/contracts';
import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
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
    console.log(file);
    const fileName = `${userId}_${Date.now()}-${file.originalname}`;

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

  public async deleteFile(fileName: string) {
    this.logger.log(`Attempting to delete file...`);
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File ${fileName} deleted successfully`);
      return { message: 'File deleted successfully' };
    } catch (err) {
      this.logger.error(`Error deleting file ${fileName}: ${err}`);
      throw new BadRequestException('Error deleting file');
    }
  }
}
