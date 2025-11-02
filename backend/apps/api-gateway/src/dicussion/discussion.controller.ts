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
import { CurrentUser } from '../common/role/current-user.decorator';
import { JwtDto, MemberShip, RequestPaginationDto, Role, SenderSnapshotDto } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { CreateDiscussionMessageDto } from './dto/create-discussion-message.dto';
import { CreateDirectDiscussionDto } from './dto/create-direct-discussion.dto';
import { DiscussionService } from './discussion.service';
import { options } from 'joi';

@ApiTags('Discussion')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('discussions')
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) { }

  @Get()
  @ApiOperation({ summary: 'Get discussions for user' })
  @ApiResponse({ status: 200, description: 'List of Discussions.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getDiscussionsForUser(
    @CurrentUser('id') userId: string,
    @Query() options: RequestPaginationDto,
  ) {
    const { page = 1, limit = 20 } = options;
    return this.discussionService.getDiscussionsForUser(userId, page, limit);
  }


  @Get(':discussionId')
  @ApiOperation({ summary: 'Get discussion' })
  @ApiParam({
    name: 'discussionId',
    description: 'discussion ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 200, description: 'Get discussion success.' })
  @ApiResponse({ status: 404, description: 'discussion not found.' })
  getDiscussionById(
    @Param('discussion') discussionId: string,
    @CurrentUser('id') userId: string,
    @Query() requestPaginationDto: RequestPaginationDto
  ) {
    return this.discussionService.getDiscussionById(discussionId, userId, requestPaginationDto);
  }

  @Get('/:discussionId/messages/search')
  @ApiOperation({ summary: 'Get message' })
  @ApiParam({
    name: 'discussionId',
    description: 'discussion ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 200, description: 'Get message success.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  getMessageById(
    @Param('discussionId') discussionId: string,
    @Query() options: RequestPaginationDto,
    @CurrentUser('id') userId: string
  ) {
    const { query = "", page = 1, limit = 20 } = options;
    return this.discussionService.searchMessages(query, discussionId, userId, page, limit);
  }

  @Get(':discussionId/messages')
  @ApiOperation({ summary: 'Get messages for discussion' })
  @ApiParam({
    name: 'discussionId',
    description: 'discussion ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 200, description: 'List of messages.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  getMessagesForDiscussion(
    @CurrentUser('id') userId: string,
    @Param('discussionId') discussionId: string,
    @Query() options: RequestPaginationDto,
  ) {
    const { page = 1, limit = 20 } = options;
    return this.discussionService.getMessagesForDiscussion({
      userId,
      discussionId,
      page,
      limit,
    });
  }

  @Get('teams/:teamId')
  getDiscussionByTeamId(
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.discussionService.getDiscussionByTeamId(userId, teamId);
  }


  @Post('/direct')
  @ApiOperation({ summary: 'Create direct Discussion' })
  @ApiResponse({ status: 201, description: 'Create direct Discussion success.' })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  createDirectDiscussion(
    @CurrentUser('id') senderId: string,
    @Body() createDirectDiscussionDto: CreateDirectDiscussionDto,
  ) {
    return this.discussionService.createDirectDiscussion({
      senderId,
      partnerId: createDirectDiscussionDto.partnerId,
    });
  }

  @Post(':discussionId/messages')
  @ApiOperation({ summary: 'Send message' })
  @ApiParam({
    name: 'discussionId',
    description: 'discussion ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiResponse({ status: 201, description: 'Send message success.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'discussion not found.' })
  createDiscussionMessage(
    @CurrentUser() payload: JwtDto,
    @Param('discussionId') discussionId: string,
    @Body() createDiscussionMessageDto: CreateDiscussionMessageDto,
  ) {
    const sender: SenderSnapshotDto = {
      _id: payload.id,
      name: payload.name,
      avatar: payload.avatar,
      status: MemberShip.ACTIVE
    }
    return this.discussionService.createDiscussionMessage({
      ...createDiscussionMessageDto,
      sender,
      discussionId,
    });
  }
}
