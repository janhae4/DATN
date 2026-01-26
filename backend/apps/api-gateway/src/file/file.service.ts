import { Injectable } from '@nestjs/common';
import { FILE_EXCHANGE, FILE_PATTERN } from '@app/contracts';
import { RmqClientService } from '@app/common';
import { Response } from 'express';
import { ZipHelper } from './zip.helper';
import { FileDownloadResult } from '@app/contracts';
import { BulkVisibility, MoveFile, MoveFiles } from './dto/update-file.dto';
import { allow } from 'joi';

@Injectable()
export class FileService {
    constructor(
        private readonly amqp: RmqClientService,
        private readonly zipHelper: ZipHelper
    ) { }

    private async sendRpcRequest(routingKey: string, payload: any) {
        return await this.amqp.request({
            exchange: FILE_EXCHANGE,
            routingKey: routingKey,
            payload: payload,
        });
    }

    async initiateUpload(
        fileName: string,
        fileType: string,
        userId: string,
        projectId?: string,
        teamId?: string,
        parentId: string | null = null
    ) {
        return await this.sendRpcRequest(FILE_PATTERN.INITIAL_UPLOAD, {
            fileName,
            fileType,
            userId,
            projectId,
            teamId,
            parentId
        });
    }

    async createFolder(name: string, parentId: string | null, userId: string, projectId?: string, teamId?: string) {
        return await this.sendRpcRequest(FILE_PATTERN.CREATE_FOLDER, {
            name,
            parentId,
            userId,
            projectId,
            teamId
        });
    }

    async getFolder(userId: string, folderId: string) {
        return await this.sendRpcRequest(FILE_PATTERN.GET_FOLDER, {
            userId,
            folderId,
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
        return await this.sendRpcRequest(FILE_PATTERN.RENAME, {
            fileId,
            newFileName,
            userId,
            projectId,
        });
    }

    async deleteFile(fileId: string, userId: string, projectId?: string) {
        return await this.sendRpcRequest(FILE_PATTERN.DELETE_ITEM, {
            fileId,
            userId,
            projectId,
        });
    }

    async getFiles(
        userId: string,
        projectId?: string,
        teamId?: string,
        page: number = 1,
        limit: number = 10
    ) {
        return await this.sendRpcRequest(FILE_PATTERN.GET_FILES, {
            userId,
            projectId,
            teamId,
            page,
            limit,
        });
    }

    async getDownloadUrl(res: Response, fileId: string | string[], userId: string, projectId?: string, teamId?: string) {
        const result = await this.sendRpcRequest(FILE_PATTERN.GET_DOWNLOAD_URL, {
            fileId,
            userId,
            projectId,
            teamId
        }) as FileDownloadResult
        console.log(result);

        if (result.action === 'REDIRECT') {
            res.redirect(result.url);
            return
        }

        if (result.action === 'STREAM_FOLDER') {
            await this.zipHelper.streamZip(res, result.files, result.folderName);
            return
        }
    }

    async getPreviewUrl(fileId: string, userId: string, projectId?: string) {
        return await this.sendRpcRequest(FILE_PATTERN.GET_PREVIEW_URL, {
            fileId,
            userId,
            projectId,
        })
    }

    async confirmUpload(fileId: string, userId: string, projectId?: string) {
        return await this.sendRpcRequest(FILE_PATTERN.CONFIRM_UPLOAD, {
            fileId,
            userId,
            projectId,
        });
    }
    async getFilesByIds(fileIds: string[], userId: string) {
        return await this.sendRpcRequest(FILE_PATTERN.GET_FILES_BY_IDS, { fileIds, userId });
    }

    async moveFile(userId: string, body: MoveFile) {
        const { fileId, parentId, projectId, teamId } = body
        return await this.sendRpcRequest(FILE_PATTERN.UPDATE_FILE, {
            fileId,
            payload: { parentId },
            userId,
            projectId,
            teamId
        })
    }

    async moveFiles(userId: string, body: MoveFiles) {
        const { fileIds, parentId, projectId, teamId } = body
        return await this.sendRpcRequest(FILE_PATTERN.UPDATE_MANY_FILE, {
            fileIds,
            payload: { parentId },
            userId,
            projectId,
            teamId
        })
    }

    async changeVisibilityBulk(userId: string, body: BulkVisibility) {
        const { fileIds, visibility, allowedUserIds, projectId, teamId } = body
        return await this.sendRpcRequest(FILE_PATTERN.UPDATE_MANY_FILE, {
            fileIds,
            payload: { visibility, allowedUserIds },
            userId,
            projectId,
            teamId
        })
    }

    async deleteFiles(userId: string, fileIds: string[], projectId?: string, teamId?: string) {
        return await this.sendRpcRequest(FILE_PATTERN.DELETE_MANY_FILES, {
            fileIds,
            userId,
            projectId,
            teamId
        })
    }
}