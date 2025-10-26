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
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { JwtDto, Role } from '@app/contracts';
import { Roles } from '../common/role/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import type { Request, Response } from 'express';
import { Payload } from '@nestjs/microservices';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

  @Post('files')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
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
    @CurrentUser('id') userId: string
  ) {
    if (file.buffer.length === 0 || !file) {
      throw new BadRequestException('File is empty.');
    }

    const fileName = await this.chatbotService.uploadFile(file, userId);
    this.chatbotService.processDocument(fileName, userId);
    return {
      message: 'File is processing',
      fileName,
      originalName: file.originalname,
    };
  }

  @Get('files/user')
  @UseGuards(RoleGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  async getFilesByUserId(@Req() request: Request) {
    const user = request.user as JwtDto;
    if (!user.id) {
      throw new BadRequestException('User not found');
    }
    return await this.chatbotService.getFilesByUserId(user.id);
  }

  @Get('files/:id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  @ApiBearerAuth()
  @ApiParam({
    name: 'file id',
    type: 'string'
  })
  async getFile(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response
  ) {
    const payload = await this.chatbotService.getFile(userId, id);
    const { data, contentType } = payload;
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${id}"`,
    });
    res.send(data);
  }

  @Delete('files/:id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'file id',
    type: 'string'
  })
  async deleteFile(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return await this.chatbotService.deleteFile(userId, id);
  }

  @Patch('files/:id/content')
  @UseGuards(RoleGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'file id',
    type: 'string'
  })
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
    @CurrentUser('id') userId: string
  ) {
    console.log(id)
    return await this.chatbotService.updateFile(file, userId, id);
  }

  @Patch('files/:id/rename')
  @UseGuards(RoleGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'file id',
    type: 'string'
  })
  async renameFile(
    @Param('id') id: string,
    @Body('newName') newName: string,
    @CurrentUser('id') userId: string
  ) {
    return await this.chatbotService.renameFile(userId, id, newName);
  }

  @Post('conversations')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  @ApiBearerAuth()
  async findConversation(
    @Req() request: Request,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const user = request.user as JwtDto;
    return await this.chatbotService.findAllConversation(user.id, page, limit);
  }

  @Get('conversations/:id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: 'string',
  })
  async findConversationById(
    @Req() request: Request,
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const user = request.user as JwtDto;
    return await this.chatbotService.findConversation(user.id, id, page, limit);
  }

  @Delete('conversations/:id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: 'string',
  })
  async deleteConversation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return await this.chatbotService.deleteConversation(userId, id);
  }
}
