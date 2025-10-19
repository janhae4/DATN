import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Req,
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
import type { Request } from 'express';
import { Payload } from '@nestjs/microservices';
import { RoleGuard } from '../common/role/role.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('process-document')
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
    @Req() request: Request,
  ) {
    console.log(file);
    if (file.buffer.length === 0 || !file) {
      throw new BadRequestException('File is empty.');
    }
    const user = request.user as JwtDto;
    console.log(user);
    if (!user.id) {
      throw new BadRequestException('User not found');
    }

    const fileName = await this.chatbotService.uploadFile(file, user.id);
    this.chatbotService.processDocument(fileName, user.id);
    return {
      message: 'File is processing',
      fileName,
      originalName: file.originalname,
    };
  }

  @Post('get-files')
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

  @Delete('delete-file')
  @UseGuards(RoleGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileId: { type: 'string' },
      },
    },
    examples: {
      'application/json': {
        value: {
          fileId: 'fileId',
        },
      },
    },
  })
  async deleteFile(@Payload() payload: { fileId: string }) {
    return await this.chatbotService.deleteFile(payload.fileId);
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

  @Delete('conversations')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string' },
      },
    },
    examples: {
      'application/json': {
        value: {
          conversationId: 'conversationId',
        },
      },
    },
  })
  async deleteConversation(@Payload() payload: { conversationId: string }) {
    return await this.chatbotService.deleteConversation(payload.conversationId);
  }
}
