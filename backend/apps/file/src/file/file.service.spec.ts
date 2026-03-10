import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { getModelToken } from '@nestjs/mongoose';
import { MinioService } from '@app/minio';
import { RmqClientService } from '@app/common';
import { TeamCacheService } from '@app/redis-service';
import { File } from './schema/file.schema';
import { MemberRole, FileType, FileStatus, FileVisibility, EVENTS_EXCHANGE, EVENTS, BadRequestException, ForbiddenException, NotFoundException } from '@app/contracts';

describe('FileService', () => {
    let service: FileService;
    let fileModelMock: any;
    let minioServiceMock: any;
    let amqpMock: any;
    let teamCacheMock: any;

    beforeEach(async () => {
        fileModelMock = {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            exec: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn().mockReturnThis(),
        };

        minioServiceMock = {
            deleteFiles: jest.fn(),
            getPreSignedUploadUrl: jest.fn(),
        };

        amqpMock = {
            publish: jest.fn(),
            request: jest.fn(),
        };

        teamCacheMock = {
            getTeamMember: jest.fn(),
            checkPermission: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FileService,
                { provide: getModelToken(File.name), useValue: fileModelMock },
                { provide: MinioService, useValue: minioServiceMock },
                { provide: RmqClientService, useValue: amqpMock },
                { provide: TeamCacheService, useValue: teamCacheMock },
            ],
        }).compile();

        service = module.get<FileService>(FileService);

        // Mute logs
        jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
        jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
        jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('deleteItem', () => {
        it('should handle pure chat-files key format and delete from MinIO directly', async () => {
            const minioKey = 'chat-files/team-123/file-123.jpg';
            teamCacheMock.checkPermission.mockResolvedValueOnce(true);
            minioServiceMock.deleteFiles.mockResolvedValueOnce(undefined);

            const result = await service.deleteItem(minioKey, 'user-1', undefined, 'team-123');

            expect(teamCacheMock.checkPermission).toHaveBeenCalledWith('team-123', 'user-1');
            expect(minioServiceMock.deleteFiles).toHaveBeenCalledWith([minioKey]);
            expect(result).toEqual({ success: true });
        });

        it('should delegate generic ID to deleteManyFile', async () => {
            jest.spyOn(service, 'deleteManyFile').mockResolvedValueOnce({ success: true, deletedCount: 1 });
            
            const result = await service.deleteItem('normal-file-id', 'user-1');
            
            expect(service.deleteManyFile).toHaveBeenCalledWith(['normal-file-id'], 'user-1', undefined, undefined);
            expect(result).toEqual({ success: true, deletedCount: 1 });
        });
    });

    describe('deleteManyFile', () => {
        const mockUserId = 'user-1';
        const mockTeamId = 'team-1';
        
        it('should correctly fetch team member role and query fileModel', async () => {
            // Setup
            teamCacheMock.getTeamMember.mockResolvedValueOnce({ role: MemberRole.ADMIN });
            
            const mockFiles = [
                { _id: 'file-doc', type: FileType.FILE, storageKey: 'uuid.pdf' },
            ];
            fileModelMock.exec.mockResolvedValueOnce(mockFiles); // rootFiles
            fileModelMock.deleteMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });

            const result = await service.deleteManyFile(['file-doc'], mockUserId, undefined, mockTeamId);

            // Assertions
            expect(teamCacheMock.getTeamMember).toHaveBeenCalledWith(mockTeamId, mockUserId);
            
            expect(fileModelMock.find).toHaveBeenCalledWith({
                _id: { $in: ['file-doc'] },
                teamId: mockTeamId,
                // Because currentUserRole is ADMIN, query.userId should NOT be appended
            });

            expect(minioServiceMock.deleteFiles).toHaveBeenCalledWith(['uuid.pdf']);
            
            expect(amqpMock.publish).toHaveBeenCalledWith(
                EVENTS_EXCHANGE, 
                EVENTS.DELETE_DOCUMENT, 
                { fileIds: ['file-doc'], storageKeys: ['uuid.pdf'], userId: mockUserId, projectId: undefined, teamId: mockTeamId }
            );

            expect(result).toEqual({ success: true, deletedCount: 1 });
        });

        it('should recursively find descendant files if a folder is provided', async () => {
            teamCacheMock.getTeamMember.mockResolvedValueOnce({ role: MemberRole.MEMBER });
            
            const rootFolder = { _id: 'folder-1', type: FileType.FOLDER };
            const subFile = { _id: 'sub-file-2', type: FileType.FILE, storageKey: 'subuuid.png' };
            
            // First exec for find rootFiles
            fileModelMock.exec.mockResolvedValueOnce([rootFolder]);
            
            // Second exec for finding children in _collectAllDescendants
            fileModelMock.exec.mockResolvedValueOnce([subFile]);

            fileModelMock.deleteMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 2 }) });

            const result = await service.deleteManyFile(['folder-1'], mockUserId, undefined, mockTeamId);

            expect(fileModelMock.find).toHaveBeenNthCalledWith(2, { parentId: 'folder-1' });

            // check recursive keys
            expect(minioServiceMock.deleteFiles).toHaveBeenCalledWith(['subuuid.png']);
            expect(amqpMock.publish).toHaveBeenCalledWith(
                EVENTS_EXCHANGE,
                EVENTS.DELETE_DOCUMENT,
                { fileIds: ['folder-1', 'sub-file-2'], storageKeys: ['subuuid.png'], userId: mockUserId, projectId: undefined, teamId: mockTeamId }
            );

            expect(result).toEqual({ success: true, deletedCount: 2 });
        });

        it('should throw BadRequestException if no files found in DB matching permissions', async () => {
            fileModelMock.exec.mockResolvedValueOnce([]); // No files found

            await expect(service.deleteManyFile(['invalid-id'], mockUserId)).rejects.toThrow(
                new BadRequestException('No files found or permission denied'),
            );

            expect(minioServiceMock.deleteFiles).not.toHaveBeenCalled();
            expect(amqpMock.publish).not.toHaveBeenCalled();
        });
    });
});
