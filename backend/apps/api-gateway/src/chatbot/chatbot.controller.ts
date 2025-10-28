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
import { ChatbotService } from './chatbot.service';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Role } from '@app/contracts';
import { Roles } from '../common/role/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import type { Response } from 'express';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';

@Controller('chatbot')
@ApiBearerAuth()
@UseGuards(RoleGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

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

    const fileName = await this.chatbotService.uploadFile(file, userId, teamId);
    this.chatbotService.processDocument(fileName, userId, teamId);

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
    return await this.chatbotService.getFilesPrefix(userId, teamId);
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
    const payload = await this.chatbotService.getFile(id, userId, teamId);
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
    return await this.chatbotService.deleteFile(id, userId, teamId);
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
    return await this.chatbotService.updateFile(file, id, userId, teamId);
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
    return await this.chatbotService.renameFile(id, newName, userId, teamId);
  }

  @Get('conversations')
  @Roles(Role.USER)
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async findConversations(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
  ) {
    return await this.chatbotService.findAllConversation(
      userId, page, limit
    );
  }

  @Post('conversations/:id')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async handleMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.chatbotService.sendMessage({
      userId,
      conversationId: id,
      message,
    });
  }

  @Post('conversations/teams/:id')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async handleTeamMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.chatbotService.sendMessage({
      userId,
      teamId: id,
      message,
    });
  }

  @Get('conversations/teams/:id')
  @Roles(Role.USER)
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async findTeamConversations(
    @CurrentUser('id') userId: string,
    @Param('id') teamId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
  ) {
    return await this.chatbotService.findTeamConversation(
      userId, teamId, page, limit
    );
  }

  @Get('conversations/:id')
  @Roles(Role.USER)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async findConversationById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
    @Query('teamId') teamId?: string,
  ) {
    return await this.chatbotService.findConversation(
      userId,
      id,
      page,
      limit,
      teamId,
    );
  }

  @Delete('conversations/:id')
  @Roles(Role.USER)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'teamId', required: false, type: 'string' })
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return await this.chatbotService.deleteConversation(id, userId, teamId);
  }
}