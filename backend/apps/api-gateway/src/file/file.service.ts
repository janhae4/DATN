import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CHATBOT_EXCHANGE, FILE_EXCHANGE, FILE_PATTERN } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';
import { MinioWebhookEvent } from '../webhooks/dto/hook-upload.dto';

@Injectable()
export class FileService {
    constructor(private readonly amqp: AmqpConnection) { }

    private async sendRpcRequest(routingKey: string, payload: any) {
        const response = await this.amqp.request({
            exchange: FILE_EXCHANGE,
            routingKey: routingKey,
            payload: payload,
            timeout: 5000,
        });
        return unwrapRpcResult(response);
    }

    async initiateUpload(fileName: string, userId: string, teamId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.INITIAL_UPLOAD, {
            fileName,
            userId,
            teamId,
        });
    }

    async initiateUpdate(
        fileId: string,
        newFileName: string,
        userId: string,
        teamId?: string,
    ) {
        console.log(fileId, newFileName, userId, teamId);
        return await this.sendRpcRequest(FILE_PATTERN.INITIAL_UPDATE, {
            fileId,
            newFileName,
            userId,
            teamId,
        });
    }

    async renameFile(
        fileId: string,
        newFileName: string,
        userId: string,
        teamId?: string,
    ) {
        return this.sendRpcRequest(FILE_PATTERN.RENAME, {
            fileId,
            newFileName,
            userId,
            teamId,
        });
    }

    async deleteFile(fileId: string, userId: string, teamId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.DELETE_FILE, {
            fileId,
            userId,
            teamId,
        });
    }

    async getFiles(userId: string, teamId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.GET_FILES, {
            userId,
            teamId,
        });
    }

    async getDownloadUrl(fileId: string, userId: string, teamId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.GET_DOWNLOAD_URL, {
            fileId,
            userId,
            teamId,
        })
    }

    async getPreviewUrl(fileId: string, userId: string, teamId?: string) {
        return this.sendRpcRequest(FILE_PATTERN.GET_PREVIEW_URL, {
            fileId,
            userId,
            teamId,
        })
    }

    async confirmUpload(fileId: string, userId: string, teamId?: string) {
        return this.sendRpcRequest('file.confirm_upload', { 
            fileId,
            userId,
            teamId,
        });
    }
}