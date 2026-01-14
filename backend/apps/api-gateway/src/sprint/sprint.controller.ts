import { Controller, Post, Body, UseGuards, Get, Param, Delete, Put, Query } from '@nestjs/common';
import { CreateSprintDto, SprintStatus, UpdateSprintDto } from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role, MemberRole, PROJECT_EXCHANGE, PROJECT_PATTERNS } from '@app/contracts';
import { SprintService } from './sprint.service';
import { FindAllSprintsDto } from './dto/get-sprint.dto';
import { TeamService } from '../team/team.service';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { unwrapRpcResult } from '../common/helper/rpc';

@Controller('sprints')
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class SprintController {
  constructor(
    private readonly sprintService: SprintService,
    private readonly teamService: TeamService,
  ) { }

  @Post()
  async create(@Body() createSprintDto: CreateSprintDto, @CurrentUser('id') userId: string) {
    return this.sprintService.create({ ...createSprintDto, userId });
  }

  @Get()
  async findAll(
    @Query() query: FindAllSprintsDto,
    @CurrentUser('id') userId: string,
  ) {
    const { projectId, teamId, status } = query;
    return await this.sprintService.findAll(projectId, teamId, userId, status);
  }


  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.sprintService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSprintDto: UpdateSprintDto,
    @CurrentUser('id') userId: string
  ) {
    return this.sprintService.update(id, updateSprintDto, userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.sprintService.remove(id, userId);
  }
}
