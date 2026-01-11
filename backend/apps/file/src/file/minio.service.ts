import { BadRequestException, ClientConfigService, NotFoundException } from '@app/contracts';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
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
    }

    async onModuleInit() {
        this._ensureBucketExists();
    }

    private async _ensureBucketExists() {
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

    async delete(key: string) {
        try {
            await this.minioClient.removeObject(this.bucketName, key);
        } catch (err) {
            this.logger.error(`Minio delete failed for key ${key}:`, err);
            throw new Error(`Minio delete failed: ${err.message}`);
        }
    }

    async getPreSignedUploadUrl(
        key: string,
        expiry: number = 60 * 5,
    ) {
        try {
            const url = await this.minioClient.presignedPutObject(
                this.bucketName,
                key,
                expiry,
            );
            return url;
        } catch (err) {
            this.logger.error(`Minio getPreSignedUploadUrl failed for key ${key}:`, err);
            throw new BadRequestException('Get pre-signed upload URL failed');
        }
    }

    async getPreSignedUpdateUrl(key: string, expiry: number = 60 * 5) {
        try {
            const url = await this.minioClient.presignedPutObject(
                this.bucketName,
                key,
                expiry,
            );
            return url;
        } catch (err) {
            this.logger.error(`Minio getPreSignedUpdateUrl failed for key ${key}:`, err);
            throw new BadRequestException('Get pre-signed update URL failed');
        }
    }
    async getPreSignedViewUrl(
        storageKey: string,
        viewFilename: string,
        expiry: number = 60 * 5,
    ): Promise<string> {
        try {
            await this.minioClient.statObject(this.bucketName, storageKey);

            const reqParams = {
                'response-content-disposition': `inline; filename="${viewFilename}"`
            };

            const url = await this.minioClient.presignedGetObject(
                this.bucketName,
                storageKey,
                expiry,
                reqParams
            );
            return url;
        } catch (err: any) {
            if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
                this.logger.error(`File not found in Minio for view URL: ${storageKey}`);
                throw new NotFoundException('File not found in storage');
            }
            this.logger.error(`Minio getPreSignedViewUrl failed for key ${storageKey}:`, err);
            throw new BadRequestException('Get pre-signed view URL failed');
        }
    }

    async getPreSignedDownloadUrl(
        storageKey: string,
        downloadFilename: string,
        expiry: number = 60 * 5,
    ): Promise<string> {
        try {
            await this.minioClient.statObject(this.bucketName, storageKey);

            const url = await this.minioClient.presignedGetObject(
                this.bucketName,
                storageKey,
                expiry,
                { 'response-content-disposition': `attachment; filename="${downloadFilename}"` }
            );
            return url;
        } catch (err: any) {
            if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
                this.logger.error(`File not found in Minio for download URL: ${storageKey}`);
                throw new NotFoundException('File not found in storage');
            }
            this.logger.error(`Minio getPreSignedDownloadUrl failed for key ${storageKey}:`, err);
            throw new BadRequestException('Get pre-signed download URL failed');
        }
    }

    async getObjectMetadata(key: string) {
        try {
            return await this.minioClient.statObject(this.bucketName, key);
        } catch (err) {
            this.logger.error(`Failed to get metadata for ${key}:`, err);
            return null;
        }
    }
}