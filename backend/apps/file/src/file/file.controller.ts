import { Controller } from '@nestjs/common';
import { FileService } from './file.service';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { FILE_PATTERN, DeleteFilePayload, FILE_EXCHANGE, UploadFilePayload, UpdateFilePayload, EVENTS_EXCHANGE, FileStatus } from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class FileController {
  constructor(
    private readonly fileService: FileService,
  ) { }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.UPDATE_FILE,
    queue: FILE_PATTERN.UPDATE_FILE,
    errorHandler: customErrorHandler
  })
  async handleUpdateFile(payload: UpdateFilePayload) {
    return await this.fileService.createPreSignedUpdateUrl(
      payload.fileId,
      payload.newFileName,
      payload.userId,
      payload.projectId,
    );
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
    );
  }

  @RabbitRPC({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.DELETE_FILE,
    queue: FILE_PATTERN.DELETE_FILE,
    errorHandler: customErrorHandler
  })
  async handleDeleteFile(payload: DeleteFilePayload) {
    return await this.fileService.deleteFile(
      payload.fileId,
      payload.userId,
      payload.projectId,
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
    page?: number,
    limit?: number
  }) {
    return await this.fileService.getFiles(
      payload.userId,
      payload.projectId,
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

  @RabbitSubscribe({
    exchange: FILE_EXCHANGE,
    routingKey: FILE_PATTERN.COMPLETE_UPLOAD,
    queue: FILE_PATTERN.COMPLETE_UPLOAD,
    errorHandler: customErrorHandler
  })
  async handleUploadCompletion(storageKey: string) {
    console.log("storageKey", storageKey);
    return await this.fileService.handleUploadCompletion(storageKey);
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
  async downloadFile(payload: { fileId: string, userId: string, projectId?: string }) {
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