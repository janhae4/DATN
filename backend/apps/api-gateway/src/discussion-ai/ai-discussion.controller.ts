import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AiDiscussionService } from './ai-discussion.service';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Role } from '@app/contracts';
import { Roles } from '../common/role/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import type { Response } from 'express';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';

@Controller('ai-discussions')
@ApiBearerAuth()
@UseGuards(RoleGuard)
export class AiDiscussionController {
  constructor(private readonly aiDiscussionService: AiDiscussionService) { }

  @Post('files')
  @Roles(Role.USER)
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async processDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10000000 })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    if (file.buffer.length === 0 || !file) {
      throw new BadRequestException('File is empty.');
    }

    const fileName = await this.aiDiscussionService.uploadFile(file, userId, teamId);
    this.aiDiscussionService.processDocument(fileName, userId, teamId);

    return {
      message: 'File is processing',
      fileName,
      originalName: file.originalname,
    };
  }

  @Get('files')
  @Roles(Role.USER, Role.ADMIN)
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async getFiles(
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return await this.aiDiscussionService.getFilesPrefix(userId, teamId);
  }

  @Get('files/:id')
  @Roles(Role.USER)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async getFile(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
    @Query('teamId') teamId?: string,
  ) {
    const payload = await this.aiDiscussionService.getFile(id, userId, teamId);
    const { data, contentType } = payload;
    res.set({
      'Content-Type': contentType,
    });
    res.send(data);
  }

  @Delete('files/:id')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    console.log("TEAMID", teamId)
    return await this.aiDiscussionService.deleteFile(id, userId, teamId);
  }

  @Patch('files/:id/content')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async updateFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10000000 })],
      }),
    )
    file: Express.Multer.File,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return await this.aiDiscussionService.updateFile(file, id, userId, teamId);
  }

  @Patch('files/:id/rename')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async renameFile(
    @Param('id') id: string,
    @Body('newName') newName: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return await this.aiDiscussionService.renameFile(id, newName, userId, teamId);
  }

  @Get()
  @Roles(Role.USER)
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async find(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
  ) {
    console.log
    return await this.aiDiscussionService.findAllDiscussion(
      userId, page, limit
    );
  }

  @Post(':id/messages')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async handleMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.aiDiscussionService.sendMessage({
      userId,
      discussionId: id,
      message,
    });
  }

  @Post('/teams/:id/messages')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async handleTeamMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.aiDiscussionService.sendMessage({
      userId,
      teamId: id,
      message: content,
    });
  }

  @Get('/teams/:id/messages')
  @Roles(Role.USER)
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async findTeam(
    @CurrentUser('id') userId: string,
    @Param('id') teamId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
  ) {
    return await this.aiDiscussionService.getMessages(
      userId, page, limit, undefined, teamId
    );
  }

  @Get(':id')
  @Roles(Role.USER)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async findDiscussionById(
    @CurrentUser('id') userId: string,
    @Param('id') discussionId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
    @Query('teamId') teamId?: string,
  ) {
    return await this.aiDiscussionService.findDiscussion(
      userId,
      page,
      limit,
      discussionId,
      teamId,
    );
  }

  @Get(':id/messages')
  @Roles(Role.USER)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async getMessages(
    @Param('id') discussionId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('teamId') teamId?: string,
  ) {
    return await this.aiDiscussionService.getMessages(
      userId,
      page,
      limit,
      discussionId,
      teamId,
    );
  }

  @Delete(':id')
  @Roles(Role.USER)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async deleteDiscussion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return await this.aiDiscussionService.deleteDiscussion(id, userId, teamId);
  }
}