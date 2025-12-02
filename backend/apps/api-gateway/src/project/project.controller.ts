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
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser('id') id: string,
  ) {
    return this.projectService.create({ ...createProjectDto, ownerId: id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: JwtDto,
  ) {
    const dtoWithUser = {
      ...updateProjectDto,
      ownerId: user.id,
    };
    return this.projectService.update(id, dtoWithUser);
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
