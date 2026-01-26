import { MinioService } from '@app/minio';
import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Zip, ZipPassThrough } from 'fflate';

@Injectable()
export class ZipHelper {
    private readonly logger = new Logger(ZipHelper.name);

    constructor(private readonly minioService: MinioService) { }

    async streamZip(res: Response, files: { storageKey: string, zipPath: string }[], folderName: string) {
        const zipName = `${encodeURIComponent(folderName)}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        const zip = new Zip((err, chunk, final) => {
            if (err) {
                this.logger.error('Zip Error', err);
                if (!res.headersSent) res.status(500).end();
                return;
            }
            res.write(chunk);
            if (final) res.end();
        });

        try {
            for (const file of files) {
                await this.addFileToZip(zip, file.storageKey, file.zipPath);
            }
            zip.end();
        } catch (e) {
            this.logger.error('Stream error', e);
            res.end();
        }
    }

    private async addFileToZip(zip: Zip, storageKey: string, filePath: string) {
        return new Promise<void>(async (resolve) => {
            try {
                const zipFile = new ZipPassThrough(filePath);
                zip.add(zipFile);

                const fileStream = await this.minioService.getFileStream(storageKey);

                if (!fileStream) {
                    zipFile.push(new Uint8Array(0), true);
                    resolve();
                    return;
                }

                fileStream.on('data', c => zipFile.push(new Uint8Array(c), false));
                fileStream.on('end', () => { zipFile.push(new Uint8Array(0), true); resolve(); });
                fileStream.on('error', () => { zipFile.push(new Uint8Array(0), true); resolve(); });
            } catch (e) {
                resolve();
            }
        });
    }
}