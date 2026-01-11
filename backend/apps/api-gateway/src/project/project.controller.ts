import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseFilters,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  JwtDto,
  Role,
  UpdateProjectDto,
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { TeamService } from '../team/team.service';
import { MemberRole } from '@app/contracts';

@Controller('project')
@UseGuards(RoleGuard)
@Roles(Role.ADMIN, Role.USER)
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly teamService: TeamService,
  ) { }

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser('id') id: string,
  ) {
    if (createProjectDto.teamId) {
      await this.teamService.verifyPermission(id, createProjectDto.teamId, [
        MemberRole.OWNER,
        MemberRole.ADMIN,
      ]);
    }
    return this.projectService.create({ ...createProjectDto, ownerId: id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Get(':id/stat')
  getStat(@Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.projectService.getStat(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @Get()
  findAllByTeamId(@Query('teamId') teamId: string) {
    return this.projectService.findAllByTeamId(teamId);
  }
}
