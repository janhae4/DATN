import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ChangeRoleMember } from './dto/change-role.dto';
import { Roles } from '../common/role/role.decorator';
import { MEMBER_ROLE, Role } from '@app/contracts';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMember } from './dto/add-member.dto';
import { RemoveMember } from './dto/remove-member.dto';
import { TransferOwnership } from './dto/transfer-owner.dto';

@Controller('teams')
@UseGuards(RoleGuard)
@Roles(Role.ADMIN, Role.USER)
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  findAll() {
    return this.teamService.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams by user id' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.USER)
  find(@CurrentUser('id') id: string) {
    return this.teamService.findByUserId(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by id' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Team id' })
  findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamService.findById(id, userId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create team' })
  @ApiBody({ type: CreateTeamDto })
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamService.create({
      ...createTeamDto,
      ownerId: userId,
    });
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete team' })
  @ApiParam({ name: 'id', description: 'Team id' })
  @Roles(Role.ADMIN, Role.USER)
  async deleteTeam(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return await this.teamService.removeTeam(userId, id);
  }

  @Post(':teamId/member')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add member to team' })
  @ApiParam({ name: 'teamId', description: 'Team id' })
  @ApiBody({ type: AddMember })
  @Roles(Role.ADMIN, Role.USER)
  addMember(
    @Param('teamId') teamId: string,
    @CurrentUser('id') requesterId: string,
    @Body() payload: AddMember,
  ) {
    return this.teamService.addMember({
      ...payload,
      teamId,
      requesterId,
    });
  }

  @Delete(':teamId/member/')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove member from team' })
  @ApiParam({ name: 'teamId', description: 'Team id' })
  @ApiBody({ type: RemoveMember })
  @Roles(Role.ADMIN, Role.USER)
  removeMember(
    @Param('teamId') teamId: string,
    @CurrentUser('id') requesterId: string,
    @Body() body: RemoveMember,
  ) {
    return this.teamService.removeMember({
      ...body,
      teamId,
      requesterId,
    });
  }

  @Post('/:teamId/member/leave')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave team' })
  @ApiParam({ name: 'teamId', description: 'Team id' })
  @Roles(Role.ADMIN, Role.USER)
  leaveTeam(
    @Param('teamId') teamId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.teamService.leaveTeam({
      teamId,
      requesterId,
    });
  }

  @Post(':teamId/member/transfer-ownership')
  transferOwnership(
    @Param('teamId') teamId: string,
    @CurrentUser('id') requesterId: string,
    @Body() body: TransferOwnership,
  ) {
    return this.teamService.transferOwnership({
      ...body,
      teamId,
      requesterId,
    });
  }

  @Patch(':teamId/member/:memberId/role')
  @ApiOperation({ summary: "Change a team member's role" })
  @ApiBearerAuth()
  @ApiParam({
    name: 'teamId',
    description:
      'The unique identifier of the team to which the member belongs.',
    example: '',
  })
  @ApiParam({
    name: 'memberId',
    description:
      'The unique identifier of the member whose role is being changed.',
    example: '',
  })
  @ApiBody({
    type: ChangeRoleMember,
  })
  @ApiResponse({
    status: 200,
    description: 'The member role was successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. The requester does not have permission to change roles.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. The team or target member could not be found.',
  })
  changeRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') requesterId: string,
    @Body('role') role: string,
  ) {
    return this.teamService.changeRole({
      targetId: memberId,
      newRole: MEMBER_ROLE[role],
      teamId,
      requesterId,
    });
  }
}
