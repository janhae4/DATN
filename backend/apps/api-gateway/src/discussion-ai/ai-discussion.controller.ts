import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  RequestPaginationDto,
  Role,
  MessageUserChatbot,
  REDIS_CLIENT
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '../common/helper/rpc';
import Redis from 'ioredis';
import { finalize, Observable } from 'rxjs';

@ApiTags('AI Discussion')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('ai-discussions')
export class AiDiscussionController {
  constructor(
    private readonly amqp: AmqpConnection,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các cuộc hội thoại AI của người dùng' })
  async findAllDiscussions(
    @CurrentUser('id') userId: string,
    @Query() options: RequestPaginationDto,
  ) {
    const { page = 1, limit = 20 } = options;
    return unwrapRpcResult(await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_CONVERSATIONS,
      payload: { userId, page, limit },
    }));
  }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Lấy các cuộc hội thoại AI trong một Team' })
  async findTeamDiscussions(
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Query() options: RequestPaginationDto,
  ) {
    const { page = 1, limit = 20 } = options;
    return unwrapRpcResult(await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_TEAM_CONVERSATIONS,
      payload: { userId, teamId, page, limit },
    }));
  }

  @Get(':discussionId')
  @ApiOperation({ summary: 'Lấy chi tiết và tin nhắn của một cuộc thảo luận' })
  async findOneDiscussion(
    @Param('discussionId') discussionId: string,
    @CurrentUser('id') userId: string,
    @Query() options: RequestPaginationDto,
  ) {
    const { page = 1, limit = 20 } = options;
    return unwrapRpcResult(await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
      payload: { userId, discussionId, page, limit },
    }));
  }

  @Delete(':discussionId')
  @ApiOperation({ summary: 'Xóa cuộc thảo luận' })
  async deleteDiscussion(
    @Param('discussionId') discussionId: string,
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
  ) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.DELETE_CONVERSATION,
      payload: { conversationId: discussionId, userId, teamId },
    }));
  }

  @Post('handle-message')
  @Sse('handle-message')
  async handleMessageStream(
    @Body() body: { message: string, discussionId?: string },
    @CurrentUser('id') userId: string
  ): Promise<Observable<MessageEvent>> {
    console.log('handleMessageStream', body);
    await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload: { ...body, userId }
    });

    const redisSub = this.redis.duplicate();
    const channel = `ai_stream:${body.discussionId || userId}`;

    return new Observable<MessageEvent>((observer) => {
      redisSub.subscribe(channel);

      redisSub.on('message', (chan, message) => {
        if (chan === channel) {
          const data = JSON.parse(message);

          observer.next({
            data: {
              text: data.text,
              isCompleted: data.isCompleted,
              metadata: data.metadata,
            }
          })

          if (data.isCompleted) {
            observer.complete();
          }
        }
      });

      return () => {
        redisSub.quit();
        console.log(`Unsubscribed and closed Redis connection for ${channel}`);
      };
    }).pipe(
      finalize(() => {
        redisSub.quit();
      }),
    );
  }
}