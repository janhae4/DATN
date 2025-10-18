import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto, MemberDto } from '@app/contracts';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  findAll() {
    return this.teamService.findAll();
  }

  @Get('owner/:ownerId')
  findByOwnerId(@Param('ownerId') ownerId: string) {
    return this.teamService.findByOwnerId(ownerId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.teamService.findById(id);
  }

  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(createTeamDto);
  }

  @Post(':teamId/member')
  addMember(@Param('teamId') teamId: string, @Body() member: MemberDto) {
    return this.teamService.addMember(teamId, member);
  }

  @Delete(':teamId/member/:userId/:requesterId')
  removeMember(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.teamService.removeMember(teamId, userId, requesterId);
  }

  @Patch(':teamId/admin/:userId/:requesterId/promote')
  promoteToAdmin(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.teamService.promoteToAdmin(teamId, userId, requesterId);
  }

  @Patch(':teamId/admin/:userId/:requesterId/demote')
  demoteFromAdmin(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.teamService.demoteFromAdmin(teamId, userId, requesterId);
  }
}
