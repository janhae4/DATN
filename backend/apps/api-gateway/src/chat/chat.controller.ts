import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../common/role/current-user.decorator';
import { PaginationDto } from './dto/pagination.dto';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { Role } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations for user' })
  @ApiResponse({ status: 200, description: 'List of conversations.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getConversationsForUser(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.chatService.getConversationsForUser(userId, paginationDto);
  }

  @Get('conversations/teams/:teamId')
  getConversationByTeamId(
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.chatService.getConversationByTeamId(userId, teamId);
  }

  @Get('conversations/:conversationId/messages/search')
  @ApiOperation({ summary: 'Get message' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 200, description: 'Get message success.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  getMessageById(
    @Param('conversationId') conversationId: string,
    @Query('query') query: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser('id') userId: string
  ) {
    return this.chatService.searchMessages(query, conversationId, userId, page, limit);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for conversation' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 200, description: 'List of messages.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  getMessagesForConversation(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    return this.chatService.getMessagesForConversation({
      userId,
      conversationId,
      page,
      limit,
    });
  }

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Create direct chat' })
  @ApiResponse({ status: 201, description: 'Create direct chat success.' })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  createDirectChat(
    @CurrentUser('id') senderId: string,
    @Body() createDirectChatDto: CreateDirectChatDto,
  ) {
    return this.chatService.createDirectChat({
      ...createDirectChatDto,
      senderId,
    });
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send message' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 201, description: 'Send message success.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  createChatMessage(
    @CurrentUser('id') senderId: string,
    @Param('conversationId') conversationId: string,
    @Body() createChatMessageDto: CreateChatMessageDto,
  ) {
    return this.chatService.createChatMessage({
      ...createChatMessageDto,
      senderId,
      conversationId,
    });
  }

  @Get('conversations/:conversation')
  @ApiOperation({ summary: 'Get conversation' })
  @ApiParam({
    name: 'conversation',
    description: 'Conversation ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 200, description: 'Get conversation success.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  getConversationById(
    @Param('conversation') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getConversationById(conversationId, userId);
  }
}
