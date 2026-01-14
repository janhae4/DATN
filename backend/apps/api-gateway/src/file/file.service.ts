import { Injectable } from '@nestjs/common';
import { FILE_EXCHANGE, FILE_PATTERN } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';
import { RmqClientService } from '@app/common';

@Injectable()
export class FileService {
    constructor(private readonly amqp: RmqClientService) { }

    private async sendRpcRequest(routingKey: string, payload: any) {
        const response = await this.amqp.request({
            exchange: FILE_EXCHANGE,
            routingKey: routingKey,
            payload: payload,
        });
        return unwrapRpcResult(response);
    }

    async initiateUpload(fileName: string, fileType: string, userId: string, projectId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.INITIAL_UPLOAD, {
            fileName,
            fileType,
            userId,
            projectId,
        });
    }

    async initiateUpdate(
        fileId: string,
        newFileName: string,
        userId: string,
        projectId?: string,
    ) {
        console.log(fileId, newFileName, userId, projectId);
        return await this.sendRpcRequest(FILE_PATTERN.INITIAL_UPDATE, {
            fileId,
            newFileName,
            userId,
            projectId,
        });
    }

    async renameFile(
        fileId: string,
        newFileName: string,
        userId: string,
        projectId?: string,
    ) {
        return this.sendRpcRequest(FILE_PATTERN.RENAME, {
            fileId,
            newFileName,
            userId,
            projectId,
        });
    }

    async deleteFile(fileId: string, userId: string, projectId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.DELETE_FILE, {
            fileId,
            userId,
            projectId,
        });
    }

    async getFiles(
        userId: string,
        projectId?: string,
        page: number = 1,  // Thêm tham số
        limit: number = 10 // Thêm tham số
    ) {
        return this.sendRpcRequest(FILE_PATTERN.GET_FILES, {
            userId,
            projectId,
            page,
            limit,
        });
    }

    async getDownloadUrl(fileId: string, userId: string, projectId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.GET_DOWNLOAD_URL, {
            fileId,
            userId,
            projectId,
        })
    }

    async getPreviewUrl(fileId: string, userId: string, projectId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.GET_PREVIEW_URL, {
            fileId,
            userId,
            projectId,
        })
    }

    async confirmUpload(fileId: string, userId: string, projectId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.CONFIRM_UPLOAD, {
            fileId,
            userId,
            projectId,
        });
    }
    async getFilesByIds(fileIds: string[], userId: string) {
        return this.sendRpcRequest(FILE_PATTERN.GET_FILES_BY_IDS, { fileIds, userId });
    }
}