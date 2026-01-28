import { Controller } from '@nestjs/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { FILE_PATTERN, DeleteFilePayload, FILE_EXCHANGE, UploadFilePayload, UpdateFilePayload, EVENTS_EXCHANGE, FileStatus, CreateFolder, DeleteManyFilePayload } from '@app/contracts';
import { customErrorHandler } from '@app/common';
import { File, FileDocument } from './schema/file.schema';
import { FileService } from './file.service';
import type { S3Object } from './file.service';


@Controller()
export class FileController {
  constructor(
    private readonly fileService: FileService,
  ) { }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.CREATE_FOLDER,
    queue: FILE_PATTERN.CREATE_FOLDER,
    errorHandler: customErrorHandler
  })
  async handleCreateFolder(payload: CreateFolder) {
    return await this.fileService.createFolder(
      payload.name,
      payload.parentId,
      payload.userId,
      payload.projectId,
      payload.teamId
    );
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.GET_FOLDER,
    queue: FILE_PATTERN.GET_FOLDER,
    errorHandler: customErrorHandler
  })
  async handleGetFolder(payload: {
    userId: string,
    folderId: string
  }) {
    return await this.fileService.getFolder(payload.userId, payload.folderId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.UPDATE_FILE,
    queue: FILE_PATTERN.UPDATE_FILE,
    errorHandler: customErrorHandler
  })
  async handleUpdateFile(body: {
    userId: string,
    fileId: string,
    projectId?: string,
    teamId?: string,
    payload: Partial<File>
  }) {
    return await this.fileService.updateFile(body.fileId, body.payload, body.userId, body.projectId, body.teamId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.UPDATE_MANY_FILE,
    queue: FILE_PATTERN.UPDATE_MANY_FILE,
    errorHandler: customErrorHandler
  })
  async handleUpdateManyFile(body: {
    userId: string,
    fileIds: string[],
    projectId?: string,
    teamId?: string,
    payload: Partial<File>
  }) {
    return await this.fileService.updateManyFile(body.fileIds, body.payload, body.userId, body.projectId, body.teamId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.INITIAL_UPLOAD,
    queue: FILE_PATTERN.INITIAL_UPLOAD,
    errorHandler: customErrorHandler
  })
  async handleInitialUpload(payload: UploadFilePayload) {
    return await this.fileService.createPreSignedUrl(
      payload.fileName,
      payload.userId,
      payload.projectId,
      payload.teamId,
      payload.parentId
    );
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.DELETE_ITEM,
    queue: FILE_PATTERN.DELETE_ITEM,
    errorHandler: customErrorHandler
  })
  async handleDeleteFile(payload: DeleteFilePayload) {
    return await this.fileService.deleteItem(
      payload.fileId,
      payload.userId,
      payload.projectId,
    );
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.DELETE_MANY_FILES,
    queue: FILE_PATTERN.DELETE_MANY_FILES,
    errorHandler: customErrorHandler
  })
  async handleDeleteManyFile(payload: DeleteManyFilePayload) {
    return await this.fileService.deleteManyFile(
      payload.fileIds,
      payload.userId,
      payload.projectId
    );
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.GET_FILES,
    queue: FILE_PATTERN.GET_FILES,
    errorHandler: customErrorHandler
  })
  async getFiles(payload: {
    userId: string,
    projectId?: string,
    teamId?: string,
    parentId: string | null,
    page?: number,
    limit?: number
  }) {
    return await this.fileService.getFiles(
      payload.userId,
      payload.projectId,
      payload.teamId,
      payload.parentId,
      payload.page,
      payload.limit
    );
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.RENAME,
    queue: FILE_PATTERN.RENAME,
    errorHandler: customErrorHandler
  })
  async renameFile(payload: { fileId: string, newFileName: string, userId: string, projectId?: string }) {
    const { fileId, newFileName, userId, projectId } = payload;
    return await this.fileService.renameFile(fileId, newFileName, userId, projectId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.INITIAL_UPDATE,
    queue: FILE_PATTERN.INITIAL_UPDATE,
    errorHandler: customErrorHandler
  })
  async initiateUpdate(payload: { fileId: string, newFileName: string, userId: string, projectId?: string }) {
    const { fileId, newFileName, userId, projectId } = payload;
    console.log("initiateUpdate", fileId, newFileName, userId, projectId);
    return await this.fileService.createPreSignedUpdateUrl(fileId, newFileName, userId, projectId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.COMPLETE_UPLOAD,
    queue: FILE_PATTERN.COMPLETE_UPLOAD,
    errorHandler: customErrorHandler
  })
  async handleUploadCompletion(payload: S3Object) {
    return await this.fileService.handleUploadCompletion(payload);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.GET_PREVIEW_URL,
    queue: FILE_PATTERN.GET_PREVIEW_URL,
    errorHandler: customErrorHandler
  })
  async getFileStream(payload: { fileId: string, userId: string, projectId?: string }) {
    return await this.fileService.getViewUrl(payload.fileId, payload.userId, payload.projectId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.GET_DOWNLOAD_URL,
    queue: FILE_PATTERN.GET_DOWNLOAD_URL,
    errorHandler: customErrorHandler
  })
  async downloadFile(payload: { fileId: string | string[], userId: string, projectId?: string }) {
    return await this.fileService.getDownloadUrl(payload.fileId, payload.userId, payload.projectId);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.GET_FILES_BY_IDS,
    queue: FILE_PATTERN.GET_FILES_BY_IDS,
    errorHandler: customErrorHandler
  })
  async getFilesByIds(payload: { fileIds: string[] }) {
    return await this.fileService.getFilesByIds(payload.fileIds);
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.CONFIRM_UPLOAD,
    queue: FILE_PATTERN.CONFIRM_UPLOAD,
    errorHandler: customErrorHandler
  })
  async confirmUpload(payload: { fileId: string, userId: string, projectId?: string }) {
    return await this.fileService.confirmUpload(payload.fileId, payload.userId, payload.projectId);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: FILE_PATTERN.FILE_STATUS,
    queue: "events.file.status.file",
    errorHandler: customErrorHandler
  })
  async handleFileStatus(payload: {
    fileId: string,
    fileName: string,
    status: FileStatus,
    userId: string,
    projectId?: string
  }) {
    console.log(payload);
    return await this.fileService.handleFileStatus(
      payload.fileId,
      payload.status,
      payload.projectId
    );
  }
}