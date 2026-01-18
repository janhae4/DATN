import { Controller, Post, Body, UseGuards, Get, Param, Put, Delete } from '@nestjs/common';
import { CreateEpicDto, UpdateEpicDto } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { EpicService } from './epic.service';
import { CurrentUser } from '../common/role/current-user.decorator';
import { Role } from '@app/contracts';
import { TeamService } from '../team/team.service';

@Controller('epics')
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class EpicController {
  constructor(
    private readonly epicService: EpicService,
  ) { }

  @Post()
  async create(
    @Body() createEpicDto: CreateEpicDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.epicService.create(createEpicDto, userId);
  }

  @Get('project/:projectId')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findAllByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.epicService.findAllByProjectId(projectId, userId);
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
