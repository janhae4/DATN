import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { CreateSprintDto } from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
import { SprintService } from './sprint.service';

@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  create(@Body() createSprintDto: CreateSprintDto, @CurrentUser('id') userId: string) {
    if (!createSprintDto.userId) {
      createSprintDto.userId = userId;
    }
    return this.sprintService.create(createSprintDto);
  }

  @Get('project/:projectId')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findAllByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.sprintService.findAllByProjectId(projectId, userId);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.sprintService.findOne(id, userId);
  }
}
