import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';
import { BadRequestException, Error as RpcError, MemberRole, NotFoundException, Team, TEAM_EXCHANGE, TEAM_PATTERN, CHATBOT_EXCHANGE, FILE_PATTERN, CHATBOT_PATTERN, SOCKET_EXCHANGE, FileStatus, EVENTS_EXCHANGE, EVENTS } from '@app/contracts';
import { FileDocument } from './schema/file.schema';
import { MinioService } from './minio.service';
import { randomUUID } from 'crypto';
import path from 'path';
import { RmqClientService } from '@app/common';

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name)
    constructor(
        @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
        private readonly minioService: MinioService,
        private readonly amqp: RmqClientService
    ) { }

    async deleteOne(query: FilterQuery<FileDocument>) {
        try {
            await this.fileModel.deleteOne(query).exec();
        } catch (e) {
            throw new BadRequestException(e)
        }

    }

    async updateOne(
        query: FilterQuery<FileDocument>,
        update: UpdateQuery<FileDocument>,
    ) {
        return this.fileModel.updateOne(query, update).exec();
    }

    async _verifyPermission(fileId: string, roles: MemberRole[], userId: string, projectId?: string) {
        const file = await this.fileModel.findOne({ _id: fileId }).exec();
        console.log(fileId, roles, userId, projectId);
        if (!file) {
            this.logger.error(`File ${fileId} not found`);
            throw new NotFoundException(`File not found`);
        }

        const isOwner = file.userId === userId;

        /* Temporarily disable strict permission check as logic was team-based
        if (!isOwner) {
            if (!file.projectId) {
                throw new ForbiddenException('Access denied to this file');
            }
            if (projectId && projectId !== file.projectId) {
                throw new ForbiddenException('Access denied to this file');
            }
             // Logic to verify project membership via RPC would go here
        }
        */
        return file
    }

    async createPreSignedUrl(originalName: string, userId: string, projectId?: string) {
        this.logger.log(`Start Pre-signed URL: ${originalName}`);

        const fileId = randomUUID();
        const extension = path.extname(originalName);
        const storageKey = `${fileId}${extension}`;

        try {
            await this.fileModel.create({
                _id: fileId,
                storageKey,
                originalName,
                userId,
                projectId,
                status: FileStatus.PENDING,
                createdAt: new Date(),
            });
        } catch (dbError) {
            this.logger.error(`DB create PENDING failed: ${dbError.message}`);
            throw new Error('Failed to create file record');
        }
        const uploadUrl = await this.minioService.getPreSignedUploadUrl(storageKey);

        return {
            uploadUrl: uploadUrl,
            fileId: fileId,
        };
    }

    async createPreSignedUpdateUrl(
        fileId: string,
        newFileName: string,
        userId: string,
        projectId?: string,
    ) {

        const file = await this._verifyPermission(fileId, [MemberRole.ADMIN, MemberRole.OWNER], userId, projectId);

        await file.updateOne({
            $set: {
                pendingNewName: newFileName,
                status: FileStatus.UPDATING,
            },
        })

        const storageKey = file.storageKey;
        const uploadUrl = await this.minioService.getPreSignedUploadUrl(storageKey);

        return {
            uploadUrl: uploadUrl,
            fileId: fileId,
        };
    }

    async deleteFile(fileId: string, userId: string, projectId?: string) {
        console.log(fileId, userId)
        const file = await this._verifyPermission(fileId, [MemberRole.ADMIN, MemberRole.OWNER], userId, projectId);
        try {
            await Promise.all([
                this.fileModel.deleteOne({ _id: fileId }).exec(),

                this.minioService.delete(file.storageKey),

                this.amqp.publish(
                    EVENTS_EXCHANGE,
                    EVENTS.DELETE_DOCUMENT,
                    { fileId: file._id, userId: file.userId, projectId: file.projectId }
                )
            ]);
        } catch (error) {
            this.logger.error(`Failed to delete file ${fileId}: ${error.message}`);
            throw new BadRequestException('Failed to delete file');
        }
    }

    async renameFile(fileId: string, newFileName: string, userId: string, projectId?: string) {
        const file = await this._verifyPermission(fileId, [MemberRole.ADMIN, MemberRole.OWNER], userId, projectId);
        try {
            await Promise.all([
                file.updateOne({
                    $set: {
                        originalName: newFileName,
                    }
                }),
            ]);
        } catch (error) {
            this.logger.error(`Failed to rename file ${fileId}: ${error.message}`);
            throw new BadRequestException('Failed to rename file');
        }
    }

    async handleUploadCompletion(storageKey: string) {
        this.logger.log(`Handle upload completion for ${storageKey}`);

        const file = await this.fileModel.findOne({ storageKey: storageKey });
        if (!file) {
            this.logger.error(`File ${storageKey} not found`);
            throw new NotFoundException(`File not found`);
        }

        const metadata = await this.minioService.getObjectMetadata(storageKey);

        const fileOriginalName = file.pendingNewName || file.originalName;

        try {
            await file.updateOne(
                {
                    $set: {
                        originalName: fileOriginalName,
                        status: FileStatus.UPLOADED,
                        size: metadata?.size || 0,
                        mimetype: metadata?.metaData?.['content-type'] || 'application/octet-stream',
                    },
                    $unset: {
                        pendingNewName: ''
                    }
                }
            );
        } catch (dbError) {
            this.logger.error(`DB update UPLOADED failed: ${dbError.message}`);
            throw new BadRequestException('Failed to update file record');
        }

        this.amqp.publish(
            SOCKET_EXCHANGE,
            FILE_PATTERN.COMPLETE_UPLOAD,
            {
                projectId: file.projectId,
                fileId: file._id,
                status: FileStatus.UPLOADED,
                userId: file.userId
            }
        );

        this.amqp.publish(
            CHATBOT_EXCHANGE,
            CHATBOT_PATTERN.PROCESS_DOCUMENT,
            {
                fileId: file._id,
                storageKey: file.storageKey,
                originalName: fileOriginalName,
                userId: file.userId,
                projectId: file.projectId
            }
        );
    }

    async confirmUpload(fileId: string, userId: string, projectId?: string) {
        const file = await this._verifyPermission(fileId, [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER], userId, projectId);
        return this.handleUploadCompletion(file.storageKey);
    }

    async getFiles(
        userId: string,
        projectId?: string,
        page: number = 1,
        limit: number = 10,
    ) {
        let query: FilterQuery<FileDocument> = {};

        const safePage = Number(page) || 1;
        const safeLimit = Number(limit) || 10;
        const skip = (safePage - 1) * safeLimit;

        if (projectId) {
            /* 
            // Permission check can be reinstated when project microservice is integrated
            const permissionTeam = await this.amqp.request<Team & RpcError>({
                exchange: TEAM_EXCHANGE,
                routingKey: TEAM_PATTERN.FIND_BY_ID,
                payload: { id: teamId, userId }
            })

            if (permissionTeam.error) {
                throw new ForbiddenException(permissionTeam.message);
            }
            */
            query = { projectId: projectId };
        } else {
            query = {
                userId: userId,
                projectId: { $in: [null, undefined] },
            };
        }

        const [files, totalItems] = await Promise.all([
            this.fileModel
                .find(query)
                .select('_id originalName createdAt status size mimetype')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .exec(),

            this.fileModel.countDocuments(query).exec(),
        ]);

        const totalPages = Math.ceil(totalItems / safeLimit);

        return {
            data: files,
            pagination: {
                totalItems,
                totalPages,
                currentPage: safePage,
                limit: safeLimit,
            },
        };
    }

    async getFilesByIds(fileIds: string[]) {
        if (!fileIds || fileIds.length === 0) return [];
        return this.fileModel.find({ _id: { $in: fileIds } }).exec();
    }

    async handleFileStatus(
        fileId: string,
        fileStatus: FileStatus,
        projectId?: string,
    ) {
        console.log(fileId, fileStatus, projectId);
        let query: FilterQuery<FileDocument> = { _id: fileId };
        if (projectId) {
            query = { projectId: projectId };
        }
        await this.fileModel.findOneAndUpdate(query, { status: fileStatus }, { new: true });
    }

    async getViewUrl(fileId: string, userId: string, projectId?: string) {
        const file = await this._verifyPermission(fileId, [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER], userId, projectId);

        const fileExtension = path.extname(file.originalName).toLowerCase();
        const allowedViewTypes = ['.pdf', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
        if (!allowedViewTypes.includes(fileExtension)) {
            throw new BadRequestException('File type cannot be viewed directly.');
        }

        const viewUrl = await this.minioService.getPreSignedViewUrl(
            file.storageKey,
            file.originalName
        );

        return { viewUrl };
    }

    async getDownloadUrl(fileId: string, userId: string, projectId?: string) {
        const file = await this._verifyPermission(fileId, [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER], userId, projectId);

        const downloadUrl = await this.minioService.getPreSignedDownloadUrl(
            file.storageKey,
            file.originalName
        );

        return { downloadUrl };
    }
}