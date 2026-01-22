import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  Role,
  UpdateProjectDto,
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { TeamService } from '../team/team.service';

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
    return await this.projectService.create({ ...createProjectDto, ownerId: id });
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
