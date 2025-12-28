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

@ApiTags('File Management')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Roles(Role.ADMIN, Role.USER)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('initiate-upload')
  @ApiOperation({ summary: '1. Get Pre-signed URL for a new file' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiBody({ type: InitiateUploadDto })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL and fileId' })
  initiateUpload(
    @Body() body: InitiateUploadDto,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.initiateUpload(body.fileName, userId, teamId);
  }

  @Post(':fileId/initiate-update')
  @ApiOperation({ summary: '2. Get Pre-signed URL to update/overwrite an existing file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to update' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiBody({ type: InitiateUpdateDto })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL' })
  initiateUpdate(
    @Param('fileId') fileId: string,
    @Body() body: InitiateUpdateDto,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.initiateUpdate(
      fileId,
      body.newFileName,
      userId,
      teamId,
    );
  }

  @Get(':fileId/preview')
  @ApiOperation({ summary: '3. Get Pre-signed URL to preview a file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to download' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL' })
  getFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.getPreviewUrl(fileId, userId, teamId);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: '4. Get Pre-signed URL to download a file' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to download' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiResponse({ status: 201, description: 'Returns the Pre-signed URL' })
  downloadFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.getDownloadUrl(fileId, userId, teamId);
  }

  @Patch(':fileId/rename')
  @ApiOperation({ summary: '4. Rename a file (Metadata only)' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to rename' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiBody({ type: RenameFileDto })
  @ApiResponse({ status: 200, description: 'File renamed successfully' })
  renameFile(
    @Param('fileId') fileId: string,
    @Body() body: RenameFileDto,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.renameFile(fileId, body.newFileName, userId, teamId);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: '5. Delete a file (from Minio and DB)' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to delete' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.deleteFile(fileId, userId, teamId);
  }

  @Get()
  @ApiOperation({ summary: '6. List all files for user or team' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns a list of file metadata' })
  getFiles(
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.getFiles(userId, teamId);
  }

  // --- THÊM ĐOẠN NÀY ---
  @Post(':fileId/confirm')
  @ApiOperation({ summary: '7. Confirm file upload completion' })
  @ApiParam({ name: 'fileId', type: 'string', description: 'The UUID of the file to confirm' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'File confirmed successfully' })
  confirmUpload(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.fileService.confirmUpload(fileId, userId, teamId);
  }

  
}