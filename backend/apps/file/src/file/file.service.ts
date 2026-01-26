import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';
import { BadRequestException, Error as RpcError, MemberRole, NotFoundException, Team, TEAM_EXCHANGE, TEAM_PATTERN, CHATBOT_EXCHANGE, FILE_PATTERN, CHATBOT_PATTERN, SOCKET_EXCHANGE, FileStatus, EVENTS_EXCHANGE, EVENTS, FileType, ForbiddenException, ZipFileEntry, FileVisibility } from '@app/contracts';
import { File, FileDocument } from './schema/file.schema';
import { randomUUID } from 'crypto';
import path from 'path';
import { RmqClientService } from '@app/common';
import { MinioService } from '@app/minio';
import { TeamCacheService } from '@app/redis-service';

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name)
    constructor(
        @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
        private readonly minioService: MinioService,
        private readonly amqp: RmqClientService,
        private readonly teamCache: TeamCacheService
    ) { }

    private async _verifyPermission(fileId: string, userId: string, projectId?: string, teamId?: string): Promise<{ file: FileDocument, currentUserRole?: MemberRole | null }> {
        let currentUserRole: MemberRole | null = null;

        if (projectId && teamId) {
            currentUserRole = await this.teamCache.getTeamMember(teamId, userId);
            if (!currentUserRole) {
                this.logger.error(`User ${userId} not found in team ${teamId}`);
                throw new BadRequestException('User not found in team');
            }
        }

        const file = await this.fileModel.findOne({ _id: fileId }).exec();

        if (!file) throw new NotFoundException(`File not found`);
        if (teamId && file.teamId !== teamId) throw new BadRequestException('File does not belong to the specified team');

        if (file.userId === userId) return { file, currentUserRole };

        if ([MemberRole.ADMIN, MemberRole.OWNER].includes(currentUserRole as MemberRole)) return { file, currentUserRole };

        if (file.visibility === FileVisibility.PRIVATE) throw new ForbiddenException('This file is private');

        if (file.visibility === FileVisibility.SPECIFIC) {
            const isAllowed = file.allowedUserIds && file.allowedUserIds.includes(userId);
            if (!isAllowed) {
                throw new ForbiddenException('You do not have permission to access this file');
            }
        }

        return { file, currentUserRole };
    }

    async createPreSignedUrl(
        originalName: string,
        userId: string,
        projectId?: string,
        teamId?: string,
        parentId: string | null = null
    ) {
        if (teamId && parentId) {
            await this.teamCache.checkPermission(teamId, userId);
        }

        const fileId = randomUUID();
        const extension = path.extname(originalName);
        const storageKey = `${fileId}${extension}`;

        if (parentId) {
            const parent = await this.fileModel.findOne({ _id: parentId, type: FileType.FOLDER });
            if (!parent) throw new NotFoundException('Folder not found');
        }

        try {
            await this.fileModel.create({
                _id: fileId,
                storageKey,
                originalName,
                userId,
                projectId,
                teamId,
                parentId: parentId || null,
                type: FileType.FILE,
                status: FileStatus.PENDING,
                createdAt: new Date(),
                visibility: FileVisibility.PRIVATE
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

    async createFolder(name: string, parentId: string | null, userId: string, projectId?: string, teamId?: string) {
        if (teamId && parentId) {
            await this.teamCache.checkPermission(teamId, userId);
        }

        if (parentId) {
            const parent = await this.fileModel.findOne({ _id: parentId, type: FileType.FOLDER });
            if (!parent) throw new NotFoundException('Parent folder not found');
        }

        const newFolder = await this.fileModel.create({
            _id: randomUUID(),
            originalName: name,
            userId,
            projectId: projectId || null,
            type: FileType.FOLDER,
            parentId: parentId || null,
            teamId: teamId || null,
            status: FileStatus.UPLOADED,
            size: 0,
            createdAt: new Date(),
        });

        return newFolder;
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
        const { file } = await this._verifyPermission(fileId, userId, projectId);
        return this.handleUploadCompletion(file.storageKey);
    }

    async getFiles(
        userId: string,
        projectId?: string,
        teamId?: string,
        parentId: string | null = null,
        page: number = 1,
        limit: number = 10,
    ) {
        let query: FilterQuery<FileDocument> = {
            parentId: null
        };

        const safePage = Number(page) || 1;
        const safeLimit = Number(limit) || 10;
        const skip = (safePage - 1) * safeLimit;

        if (projectId && teamId) {
            query.projectId = projectId;

            const member = await this.teamCache.getTeamMember(teamId as string, userId);
            if (!member) {
                throw new ForbiddenException('You are not a member of this team.');
            }
            let currentUserRole = member.role;
            if (currentUserRole === MemberRole.MEMBER) {
                query.$or = [
                    { userId: userId },
                    { visibility: FileVisibility.TEAM, teamId },
                    {
                        visibility: FileVisibility.SPECIFIC,
                        allowedUserIds: userId
                    }
                ];
            }


        } else {
            query.userId = userId;
            query.projectId = { $in: [null, undefined] };
        }

        if (parentId) {
            query.parentId = parentId;
        }
        console.log(query)

        const [files, totalItems] = await Promise.all([
            this.fileModel
                .find(query)
                .select('_id originalName parentId createdAt teamId status size mimetype type visibility allowedUserIds')
                .sort({ type: -1, createdAt: -1 })
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
        }
    }

    async createPreSignedUpdateUrl(
        fileId: string,
        newFileName: string,
        userId: string,
        projectId?: string,
    ) {

        const { file } = await this._verifyPermission(fileId, userId, projectId);

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

    async deleteItem(id: string, userId: string, projectId?: string, teamId?: string) {
        return this.deleteManyFile([id], userId, projectId, teamId);
    }

    async deleteManyFile(fileIds: string[], userId: string, projectId?: string, teamId?: string) {
        let currentUserRole = MemberRole.MEMBER;
        if (teamId) {
            const member = await this.teamCache.getTeamMember(teamId, userId);
            currentUserRole = member?.role || MemberRole.MEMBER;
        }

        console.log(fileIds)

        const query: FilterQuery<FileDocument> = { _id: { $in: fileIds } };
        if (teamId) query.teamId = teamId;
        if (currentUserRole === MemberRole.MEMBER) query.userId = userId;
        const rootFiles = await this.fileModel.find(query).exec();
        if (rootFiles.length === 0) throw new BadRequestException('No files found or permission denied');
        const { allIds, allStorageKeys } = await this._collectAllDescendants(rootFiles);

        if (allStorageKeys.length > 0) {
            await this.minioService.deleteFiles(allStorageKeys);
        }

        const result = await this.fileModel.deleteMany({ _id: { $in: allIds } }).exec();

        this.amqp.publish(EVENTS_EXCHANGE, EVENTS.DELETE_DOCUMENT, { fileIds: allIds, userId, projectId });

        return { success: true, deletedCount: result.deletedCount };
    }

    private async _collectAllDescendants(roots: FileDocument[]): Promise<{ allIds: string[], allStorageKeys: string[] }> {
        const allIds: string[] = [];
        const allStorageKeys: string[] = [];

        const processNode = async (file: FileDocument) => {
            allIds.push(file._id);
            if (file.type !== FileType.FOLDER && file.storageKey) {
                allStorageKeys.push(file.storageKey);
            }

            if (file.type === FileType.FOLDER) {
                const children = await this.fileModel.find({ parentId: file._id }).exec();
                await Promise.all(children.map(child => processNode(child)));
            }
        };

        await Promise.all(roots.map(root => processNode(root)));
        return { allIds, allStorageKeys };
    }

    async renameFile(fileId: string, newFileName: string, userId: string, projectId?: string) {
        const { file } = await this._verifyPermission(fileId, userId, projectId);
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

    async updateFile(fileId: string, payload: Partial<File>, userId: string, projectId?: string, teamId?: string) {
        await this._verifyPermission(fileId, userId, projectId, teamId);
        const updateData = {
            ...(payload.originalName && { originalName: payload.originalName }),
            ...(payload.status && { status: payload.status }),
            ...(payload.parentId && { parentId: payload.parentId }),
            ...(payload.teamId && { teamId: payload.teamId }),
            ...(payload.projectId && { projectId: payload.projectId }),
        }

        console.log(updateData);
        try {
            const updatedFile = await this.fileModel.findByIdAndUpdate(
                fileId,
                { $set: updateData },
            ).exec();

            if (!updatedFile) {
                throw new BadRequestException('File not found after update');
            }

            return {
                success: true,
                message: `Updated file successfully`
            };

        } catch (error) {
            this.logger.error(`Failed to update file ${fileId}: ${error.message}`);
            throw new BadRequestException('Failed to update file');
        }
    }

    async updateManyFile(
        fileIds: string[],
        payload: Partial<File>,
        userId: string,
        projectId?: string,
        teamId?: string
    ) {

        let currentUserRole = MemberRole.MEMBER;
        if (teamId && projectId) {
            const user = await this.teamCache.getTeamMember(teamId, userId);
            if (!user) {
                throw new ForbiddenException('You are not a member of this team.');
            }
            currentUserRole = user?.role || MemberRole.MEMBER;
        }

        let permissionOverride = {};
        if (payload.parentId) {
            const destFolder = await this.fileModel.findOne({
                _id: payload.parentId,
                type: FileType.FOLDER
            }).lean();

            if (!destFolder) {
                throw new BadRequestException('Destination folder not found');
            }


            if (teamId && destFolder.teamId !== teamId) {
                throw new BadRequestException('Destination folder belongs to another team');
            }

            if (currentUserRole === MemberRole.MEMBER) {
                const isOwner = destFolder.userId === userId;
                const isPublicTeam = destFolder.visibility === FileVisibility.TEAM;

                if (!isOwner && !isPublicTeam) {
                    const isSharedWithMe = destFolder.visibility === FileVisibility.SPECIFIC &&
                        destFolder.allowedUserIds?.includes(userId);

                    if (!isSharedWithMe) {
                        throw new ForbiddenException('You cannot move files to a private/restricted folder');
                    }
                }
            }

            permissionOverride = {
                visibility: destFolder.visibility,
                allowedUserIds: destFolder.allowedUserIds,
                teamId: destFolder.teamId,
                projectId: destFolder.projectId
            };
        }

        const query: FilterQuery<FileDocument> = {
            _id: { $in: fileIds }
        };

        if (teamId) query.teamId = teamId;
        if (projectId) query.projectId = projectId;

        if (currentUserRole === MemberRole.MEMBER) {
            query.userId = userId;
        }

        const updateData = {
            ...(payload.originalName && { originalName: payload.originalName }),
            ...(payload.status && { status: payload.status }),
            ...(payload.parentId && { parentId: payload.parentId }),
            ...(payload.visibility && { visibility: payload.visibility }),
            ...(payload.allowedUserIds && { allowedUserIds: payload.allowedUserIds }),
            ...permissionOverride
        };


        try {

            const result = await this.fileModel.updateMany(
                query,
                {
                    $set: updateData
                }
            ).exec();

            if (result.matchedCount === 0) {
                throw new BadRequestException('No files found or you do not have permission to update these files');
            }

            return {
                success: true,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                message: `Updated ${result.modifiedCount} files successfully`
            };

        } catch (error) {
            this.logger.error(`Failed to update files: ${error.message}`);
            throw new BadRequestException('Failed to update files');
        }
    }

    async getFolder(userId: string, folderId: string, page: number = 1, limit: number = 10) {
        const currentFolder = await this.fileModel.findOne({ _id: folderId }).exec();

        if (!currentFolder) {
            throw new NotFoundException('Folder not found');
        }

        if (currentFolder.userId.toString() !== userId) {
            throw new ForbiddenException('You do not have permission to access this folder');
        }

        const query = { parentId: folderId };

        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.fileModel.find(query)
                .sort({ type: -1, createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .exec(),
            this.fileModel.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: items,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
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
        let query: FilterQuery<FileDocument> = { _id: fileId };
        if (projectId) {
            query = { projectId: projectId };
        }
        await this.fileModel.findOneAndUpdate(query, { status: fileStatus }, { new: true });
    }

    async getViewUrl(fileId: string, userId: string, projectId?: string, teamId?: string) {
        const { file } = await this._verifyPermission(fileId, userId, projectId, teamId);

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

    async getDownloadUrl(fileId: string | string[], userId: string, projectId?: string, teamId?: string) {
        let currentUserRole = MemberRole.MEMBER;
        if (teamId) {
            const member = await this.teamCache.getTeamMember(teamId, userId);
            currentUserRole = member?.role || MemberRole.MEMBER;
        }

        const ids = Array.isArray(fileId) ? fileId : [fileId];
        const allFilesToStream: { storageKey: string, zipPath: string }[] = [];
        let isSingleFileRedirect = false;
        let singleFileUrl = '';

        await Promise.all(ids.map(async (id) => {
            const { file } = await this._verifyPermission(id, userId, projectId, teamId);

            if (file.type === FileType.FOLDER) {
                const folderFiles = await this._getAllFilesRecursive(file.id, file.originalName, userId, currentUserRole!);
                allFilesToStream.push(...folderFiles);
            } else {
                // File lẻ
                if (ids.length === 1) {
                    isSingleFileRedirect = true;
                    singleFileUrl = await this.minioService.getPreSignedDownloadUrl(file.storageKey, file.originalName);
                } else {
                    allFilesToStream.push({ storageKey: file.storageKey, zipPath: file.originalName });
                }
            }
        }));

        if (isSingleFileRedirect) {
            return { action: 'REDIRECT', url: singleFileUrl };
        }

        return {
            action: 'STREAM_ZIP',
            folderName: ids.length > 1 ? `download-${Date.now()}` : 'archive',
            files: allFilesToStream
        };
    }

    private async _getAllFilesRecursive(folderId: string, currentPath: string, userId: string, role: MemberRole): Promise<{ storageKey: string, zipPath: string }[]> {
        const children = await this.fileModel.find({ parentId: folderId }).exec();

        const results = await Promise.all(children.map(async (child) => {
            if (role === MemberRole.MEMBER) {
                if (child.userId !== userId && child.visibility === FileVisibility.PRIVATE) return [];
                if (child.visibility === FileVisibility.SPECIFIC && !child.allowedUserIds.includes(userId)) return [];
            }

            const childPath = `${currentPath}/${child.originalName}`;

            if (child.type === FileType.FOLDER) {
                return this._getAllFilesRecursive(child._id, childPath, userId, role);
            } else {
                return [{ storageKey: child.storageKey, zipPath: childPath }];
            }
        }));

        return results.flat();
    }
}