import { Controller, Post, Body, UseGuards, Get, Param, Put, Delete } from '@nestjs/common';
import { CreateEpicDto, UpdateEpicDto, EPIC_PATTERNS } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { EpicService } from './epic.service';
import { Inject } from '@nestjs/common';
import { CurrentUser } from '../common/role/current-user.decorator';
import { EPIC_EXCHANGE, MemberRole, PROJECT_EXCHANGE, PROJECT_PATTERNS, Role } from '@app/contracts';
import { ClientProxy } from '@nestjs/microservices';
import { TeamService } from '../team/team.service';
import { firstValueFrom } from 'rxjs';
import { unwrapRpcResult } from '../common/helper/rpc';

@Controller('epics')
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class EpicController {
  constructor(
    private readonly epicService: EpicService,
    private readonly teamService: TeamService,
    @Inject(EPIC_EXCHANGE) private readonly client: ClientProxy,
    @Inject(PROJECT_EXCHANGE) private readonly projectClient: ClientProxy,
  ) { }

  @Post()
  async create(
    @Body() createEpicDto: CreateEpicDto,
    @CurrentUser('id') userId: string,
  ) {
    const project = unwrapRpcResult(await firstValueFrom(
      this.projectClient.send(PROJECT_PATTERNS.GET_BY_ID, { id: createEpicDto.projectId })
    ));
    if (project && project.teamId) {
      await this.teamService.verifyPermission(userId, project.teamId, [
        MemberRole.OWNER,
        MemberRole.ADMIN,
      ]);
    }
    return this.epicService.create(createEpicDto);
  }

  @Get('project/:projectId')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findAllByProjectId(
    @Param('projectId') projectId: string,
  ) {
    return this.epicService.findAllByProjectId(projectId);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findOne(
    @Param('id') id: string,
  ) {
    return this.epicService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateEpicDto: UpdateEpicDto,
  ) {
    return this.epicService.update(id, updateEpicDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  remove(
    @Param('id') id: string,
  ) {
    return this.epicService.remove(id);
  }
}
