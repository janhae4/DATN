import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RequestPaginationDto, Role, User } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { CreateDirectDiscussionDto } from './dto/create-direct-discussion.dto';
import { CreateDiscussionMessageDto } from './dto/create-discussion-message.dto';
import { PermissionOverrideDto } from './dto/update-permission.dto';
import {
  CreateServerDto,
  CreateChannelDto,
  UpdateChannelDto,
  ReorderChannelsDto,
  GenerateInviteDto,
  JoinServerDto,
  UpdateServerDto
} from './dto/create-server.dto';
import { DiscussionService } from './discussion.service';

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
    @CurrentUser('id') userId: string,
    @Param('discussionId') discussionId: string,
    @Body() createDiscussionMessageDto: CreateDiscussionMessageDto,
  ) {
    const { discussionId: _, userId: __, ...sanitizedDto } = createDiscussionMessageDto;
    return this.discussionService.createDiscussionMessage({
      ...sanitizedDto,
      userId,
      discussionId,
    });
  }

  @Put(':discussionId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Toggle reaction on message' })
  @ApiParam({
    name: 'discussionId',
    description: 'Discussion ID',
    example: '6675b11a8b3a729e2e2a3b4c',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Message ID',
    example: '6675b11a8b3a729e2e2a3b4d',
  })
  @ApiResponse({ status: 200, description: 'Reaction toggled successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  toggleReaction(
    @CurrentUser('id') userId: string,
    @Param('discussionId') discussionId: string,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
  ) {
    return this.discussionService.toggleReaction(userId, messageId, body.emoji);
  }

  // Server Management Endpoints
  @Post('servers')
  @ApiOperation({ summary: 'Create new server' })
  @ApiResponse({ status: 201, description: 'Server created successfully.' })
  async createServer(
    @CurrentUser() user: User,
    @Body() createServerDto: CreateServerDto,
  ) {
    console.log('Creating server with data in controller:', createServerDto);

    return this.discussionService.createServer({
      owner: { id: user.id, name: user.name || 'Unknown User', email: user.email || '' },
      members: [],
      teamSnapshot: {
        id: createServerDto.teamId,
        name: createServerDto.name,
        avatar: createServerDto.avatar,
      },
      membersToNotify: [],
      createdAt: new Date(),
    });
  }

  @Delete('servers/:teamId')
  @ApiOperation({ summary: 'Delete server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Server deleted successfully.' })
  deleteServer(
    @CurrentUser('id') userId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.discussionService.deleteServer({
      teamId,
      requesterId: userId,
      requesterName: '',
      teamName: '',
      memberIdsToNotify: [],
    });
  }

  @Delete('servers/:teamId/permanent')
  @ApiOperation({ summary: 'Permanently delete server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Server permanently deleted.' })
  permanentDeleteServer(@Param('teamId') teamId: string) {
    return this.discussionService.permanentDeleteServer(teamId);
  }

  @Put('servers/:teamId')
  @ApiOperation({ summary: 'Update server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Server updated successfully.' })
  updateServer(
    @Param('teamId') paramTeamId: string,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.discussionService.updateServer({ teamId: paramTeamId, ...updateServerDto });
  }

  @Get('servers/user/:userId')
  @ApiOperation({ summary: 'Get user server list' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User server list retrieved.' })
  getUserServerList(@Param('userId') userId: string) {
    return this.discussionService.getUserServerList(userId);
  }

  @Get('servers/deleted/user')
  @ApiOperation({ summary: 'Get deleted servers' })
  @ApiResponse({ status: 200, description: 'Deleted servers list.' })
  getDeletedServers(@CurrentUser('id') userId: string) {
    return this.discussionService.getDeletedServers(userId);
  }

  @Put('servers/:teamId/restore')
  @ApiOperation({ summary: 'Restore soft deleted server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Server restored.' })
  restoreServer(@Param('teamId') teamId: string) {
    return this.discussionService.restoreServer(teamId);
  }

  @Get('servers/:teamId/members')
  @ApiOperation({ summary: 'Get server members with pagination' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Server members list.' })
  getServerMembers(
    @Param('teamId') teamId: string,
    @Query() options: RequestPaginationDto,
  ) {
    const { page = 1, limit = 20 } = options;
    return this.discussionService.getServerMembers({ teamId, page, limit });
  }

  // Channel Management Endpoints
  @Post('channels')
  @ApiOperation({ summary: 'Create new channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully.' })
  createChannel(
    @CurrentUser('id') userId: string,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return this.discussionService.createChannel({
      ...createChannelDto,
      ownerId: createChannelDto.ownerId || userId,
      type: createChannelDto.type as any,
    });
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  createCategory(
    @CurrentUser('id') userId: string,
    @Body() createCategoryDto: { teamId: string; name: string },
  ) {
    return this.discussionService.createCategory({
      ...createCategoryDto,
      ownerId: userId,
    });
  }

  @Put('channels/:channelId')
  @ApiOperation({ summary: 'Update channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully.' })
  updateChannel(
    @Param('channelId') channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.discussionService.updateChannel({
      id: channelId,
      name: updateChannelDto.name,
      type: updateChannelDto.type as any
    });
  }

  @Delete('channels/:channelId')
  @ApiOperation({ summary: 'Delete channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully.' })
  deleteChannel(@Param('channelId') channelId: string) {
    return this.discussionService.deleteChannel(channelId);
  }

  @Put('channels/reorder')
  @ApiOperation({ summary: 'Reorder channels' })
  @ApiResponse({ status: 200, description: 'Channels reordered successfully.' })
  reorderChannels(@Body() reorderChannelsDto: ReorderChannelsDto) {
    return this.discussionService.reorderChannels(reorderChannelsDto);
  }

  @Get('teams/:teamId/channels')
  @ApiOperation({ summary: 'Get channels by team' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Channels retrieved successfully.' })
  getChannelsByTeam(@Param('teamId') teamId: string) {
    return this.discussionService.getChannelsByTeam(teamId);
  }

  // Member Management Endpoints
  @Post('servers/:teamId/members')
  @ApiOperation({ summary: 'Add members to server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Members added successfully.' })
  addMembers(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
    @Body() body: { members: { id: string; name: string }[] },
  ) {
    const users = body.members.map(m => ({
      ...m,
      email: '',
      phone: '',
      role: '',
      isBan: false,
    } as any));

    return this.discussionService.addMembers({
      teamId,
      requesterId: user.id,
      requesterName: user.name || '',
      teamName: '',
      members: users,
      memberIdsToNotify: [],
      metadata: {},
    });
  }

  @Delete('servers/:teamId/members/:memberId')
  @ApiOperation({ summary: 'Remove member from server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.discussionService.removeMember({
      teamId,
      requesterId: user.id,
      requesterName: user.name || '',
      teamName: '',
      members: [{ id: memberId, name: '', email: '', role: '', isBan: false } as any],
      memberIdsToNotify: [],
    });
  }

  @Post('servers/:teamId/leave')
  @ApiOperation({ summary: 'Leave server' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Left server successfully.' })
  leaveServer(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.discussionService.leaveTeam({
      teamId,
      teamName: '',
      requester: { id: user.id, name: user.name || '', email: '' },
      memberIdsToNotify: [],
    });
  }

  // Invite System Endpoints
  @Post('invites')
  @ApiOperation({ summary: 'Generate invite link' })
  @ApiResponse({ status: 201, description: 'Invite generated successfully.' })
  generateInvite(
    @CurrentUser('id') userId: string,
    @Body() generateInviteDto: GenerateInviteDto,
  ) {
    return this.discussionService.generateInvite({
      ...generateInviteDto,
      creatorId: userId,
    });
  }

  @Get('invites/:code')
  @ApiOperation({ summary: 'Get invite details' })
  @ApiResponse({ status: 200, description: 'Invite details retrieved.' })
  getInvite(@Param('code') code: string) {
    return this.discussionService.getInvite(code);
  }

  @Post('invites/join')
  @ApiOperation({ summary: 'Join server via invite' })
  @ApiResponse({ status: 200, description: 'Joined server successfully.' })
  joinServer(
    @CurrentUser('id') userId: string,
    @Body() joinServerDto: JoinServerDto,
  ) {
    return this.discussionService.joinServer({
      ...joinServerDto,
      userId,
    });
  }

  @Put('users/sync')
  @ApiOperation({ summary: 'Update user info across discussions' })
  @ApiResponse({ status: 200, description: 'User info updated successfully.' })
  updateUser(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; avatar?: string },
  ) {
    return this.discussionService.updateUser({ id: userId, ...body });
  }

  @Put('servers/:teamId/members/:userId/role')
  @ApiOperation({ summary: 'Update a member role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  updateMemberRole(
    @CurrentUser('id') requesterId: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Body('role') role: any,
  ) {
    return this.discussionService.updateMemberRole({ teamId, userId, role, requesterId });
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Update discussion permissions (Owner/Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully.' })
  updatePermission(
    @Param('id') discussionId: string,
    @CurrentUser('id') requesterId: string,
    @Body() override: PermissionOverrideDto,
  ) {
    return this.discussionService.updatePermission({
      discussionId,
      requesterId,
      override
    });
  }

  // Admin Endpoints
  @Get('messages/all')
  @ApiOperation({ summary: 'Get all messages (admin)' })
  @ApiResponse({ status: 200, description: 'All messages retrieved.' })
  getAllMessages() {
    return this.discussionService.getAllMessages();
  }
}