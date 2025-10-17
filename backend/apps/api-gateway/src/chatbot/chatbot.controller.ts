import { Controller, Delete, MaxFileSizeValidator, ParseFilePipe, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { BadRequestException } from '@app/contracts/errror';
import type { Request } from 'express';
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleGuard } from '../role.guard';
import { Role } from '@app/contracts/user/user.dto';
import { Roles } from '../common/role/role.decorator';
import multer from 'multer';
import { Payload } from '@nestjs/microservices';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

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
    }
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage()
  }))
  async processDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10000000 })],
      }),
    )
    file: Express.Multer.File,
    @Req() request: Request
  ) {
    console.log(file);
    if (file.buffer.length === 0 || !file) {
      throw new BadRequestException('File không được để trống.');
    }
    const user = request.user as JwtDto;
    console.log(user)
    if (!user.id) {
      throw new BadRequestException('User not found');
    }

    const fileName = await this.chatbotService.uploadFile(file, user.id);
    this.chatbotService.processDocument(fileName, user.id);
    return {
      message: "File đang được xử lý",
      fileName,
      originalName: file.originalname
    };
  }

  @Post("get-files")
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

  @Delete("delete-file")
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
    examples: {}
   })
  async deleteFile(@Req() request: Request, @Payload() payload: { fileId: string }) {
    const user = request.user as JwtDto;
    if (!user.id) {
      throw new BadRequestException('User not found');
    }
    return await this.chatbotService.deleteFile(payload.fileId);
  }
}
