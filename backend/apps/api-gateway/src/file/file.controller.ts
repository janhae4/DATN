import {
  Controller,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Patch,
  Get,
  UseGuards,
  Res,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileService } from './file.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { InitiateUpdateDto } from './dto/initiate-update.dto';
import { RenameFileDto } from './dto/rename-file.dto';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import type { Response } from 'express';
import { BulkVisibility, MoveFile, MoveFiles } from './dto/update-file.dto';
import { DeleteFiles } from './dto/delete-file.dto';
import { DownloadFiles } from './dto/download-file.dto';

@ApiTags('File Management')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Roles(Role.ADMIN, Role.USER)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('initiate-upload')
  @ApiOperation({ summary: '1. Get Pre-signed URL for a new file' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiBody({ type: InitiateUploadDto })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL and fileId' })
  initiateUpload(
    @Body() body: InitiateUploadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.initiateUpload(body.fileName, body.fileType, userId, body.projectId, body.teamId, body.parentId);
  }

  @Post('folder')
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiBody({ type: InitiateUploadDto })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL and fileId' })
  createFolder(
    @Body() body: {
      fileName: string;
      parentId?: string;
      projectId?: string;
      teamId?: string;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.createFolder(body.fileName, body.parentId || null, userId, body.projectId, body.teamId);
  }

  @Get('folder/:folderId')
  @ApiOperation({ summary: 'Get a folder' })
  getFolder(@Param('folderId') folderId: string, @CurrentUser('id') userId: string) {
    return this.fileService.getFolder(userId, folderId);
  }

  @Post(':fileId/initiate-update')
  @ApiOperation({ summary: '2. Get Pre-signed URL to update/overwrite an existing file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to update' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiBody({ type: InitiateUpdateDto })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL' })
  initiateUpdate(
    @Param('fileId') fileId: string,
    @Body() body: InitiateUpdateDto,
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.fileService.initiateUpdate(
      fileId,
      body.newFileName,
      userId,
      projectId,
    );
  }

  @Get(':fileId/preview')
  @ApiOperation({ summary: '3. Get Pre-signed URL to preview a file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to download' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL' })
  getFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.fileService.getPreviewUrl(fileId, userId, projectId);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: '4. Get Pre-signed URL to download a file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to download' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL' })
  downloadFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
    @Query('projectId') projectId?: string,
  ) {
    return this.fileService.getDownloadUrl(res, fileId, userId, projectId);
  }

  @Post('download/bulk')
  downloadFiles(
    @Body() body: DownloadFiles,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    console.log(body);
    return this.fileService.getDownloadUrl(res, body.fileIds, userId, body.projectId, body.teamId);
  }

  @Patch(':fileId/rename')
  @ApiOperation({ summary: '4. Rename a file (Metadata only)' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to rename' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiBody({ type: RenameFileDto })
  @ApiResponse({ status: 200, description: 'File renamed successfully' })
  renameFile(
    @Param('fileId') fileId: string,
    @Body() body: RenameFileDto,
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.fileService.renameFile(fileId, body.newFileName, userId, projectId);
  }

  @Patch(':fileId/move')
  @ApiOperation({ summary: '4.1 Move a file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to rename' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiBody({ type: RenameFileDto })
  @ApiResponse({ status: 200, description: 'File renamed successfully' })
  moveFile(
    @Param('fileId') fileId: string,
    @Body() body: MoveFile,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.moveFile(userId, {
      ...body,
      fileId
    });
  }

  @Patch('move/bulk')
  @ApiOperation({ summary: '4.2 Move a files' })
  moveFiles(
    @Body() body: MoveFiles,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.moveFiles(userId, body);
  }


  @Patch('visibility/bulk') 
  @ApiOperation({ summary: 'Change visibility for multiple files' })
  async changeVisibilityBulk(
    @Body() body: BulkVisibility,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.changeVisibilityBulk(userId, body);
  }

  @Delete('/bulk')
  @ApiOperation({ summary: 'Delete files' })
  deleteFiles(
    @Body() body: DeleteFiles,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.deleteFiles(
      userId,
      body.fileIds,
      body.projectId,
      body.teamId
    );
  }

  @Delete(':fileId')
  @ApiOperation({ summary: '5. Delete a file (from Minio and DB)' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to delete' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.fileService.deleteFile(fileId, userId, projectId);
  }

  @Get()
  @ApiOperation({ summary: '6. List all files with pagination' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Default: 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default: 10' })
  @ApiResponse({ status: 200, description: 'Returns paginated files' })
  getFiles(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('projectId') projectId?: string,
    @Query('teamId') teamId?: string
  ) {
    return this.fileService.getFiles(userId, projectId, teamId, page, limit);
  }

  @Post(':fileId/confirm')
  @ApiOperation({ summary: '7. Confirm file upload completion' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to confirm' })
  @ApiQuery({ name: 'projectId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'File confirmed successfully' })
  confirmUpload(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.fileService.confirmUpload(fileId, userId, projectId);
  }
}