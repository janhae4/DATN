import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  MaxFileSizeValidator,
  MessageEvent,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  Sse,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { REDIS_CLIENT, Role } from '@app/contracts';
import { Roles } from '../common/role/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import type { Response } from 'express';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { unwrapRpcResult } from '../common/helper/rpc';

@Controller('ai-discussions')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) { }

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
    return await this.chatbotService.findAllConversation(
      userId, page, limit
    );
  }

  @Post('handle-message')
  @Sse('handle-message')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        discussionId: { type: 'string' },
        summarizeId: { type: 'string' },
      },
    },
  })
  async handleMessageStream(
    @Body() body: { message: string, discussionId: string, summarizeId: string },
    @CurrentUser('id') userId: string
  ): Promise<Observable<MessageEvent>> {
    console.log('handleMessageStream', body, userId);
    const result = unwrapRpcResult(
      await this.chatbotService.handleMessage(body.message, body.discussionId, userId, body.summarizeId)
    )

    const redisSub = this.redis.duplicate();
    const channel = `ai_stream:${result._id}`;
    let accumulatedText = '';

    return new Observable<MessageEvent>((observer) => {
      if (!body.discussionId) {
        observer.next({
          data: {
            text: "",
            isCompleted: false,
            metadata: {
              discussionId: result._id,
              name: result.name,
            }
          }
        });
      }
      redisSub.subscribe(channel, (err) => {
        if (err) console.error("Redis Subscribe Error", err);
        else {
          console.log(`Subscribed to ${channel}, triggering Python...`);

          this.chatbotService.handleMessage(body.message, body.discussionId, userId, body.summarizeId)
            .then(() => console.log("Sent signal to Python"))
            .catch(e => console.error("Trigger Python failed", e));
        }
      });

      redisSub.on('message', async (chan, message) => {
        console.log("Got message from Redis:", message);
        if (chan === channel) {
          const data = JSON.parse(message);

          if (data.text) {
            accumulatedText += data.text;
          }

          observer.next({
            data: {
              text: data.text,
              isCompleted: data.isCompleted,
              metadata: data.metadata,
            }
          })

          if (data.isCompleted) {
            try {
              await this.chatbotService.saveAiMessage(result._id, accumulatedText, data.metadata);
              console.log('Successfully saved full message to DB');
            } catch (err) {
              console.error('Failed to save message to DB:', err);
            }

            observer.complete();
          }
        }
      });

      return () => {
        if (redisSub.status !== 'end') {
          redisSub.unsubscribe();
          redisSub.quit();
        }
        console.log(`Unsubscribed and closed Redis connection for ${channel}`);
      };

    });
  }

  @Post(':id')
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

  @Post('/teams/:id')
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

  @Get('/teams/:id')
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
    return await this.chatbotService.findTeamConversation(
      userId, teamId, page, limit
    );
  }



  @Get('/:id')
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
    console.log("id", id)
    return await this.chatbotService.findConversation(
      userId,
      id,
      page,
      limit,
    );
  }

  @Delete('/:id')
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