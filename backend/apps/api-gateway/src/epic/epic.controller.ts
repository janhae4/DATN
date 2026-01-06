import { Controller, Post, Body, UseGuards, Get, Param, Put, Delete } from '@nestjs/common';
import { CreateEpicDto, UpdateEpicDto, EPIC_PATTERNS } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
import { EpicService } from './epic.service';
import { Inject } from '@nestjs/common';
import { EPIC_EXCHANGE } from '@app/contracts';
import { ClientProxy } from '@nestjs/microservices';

@Controller('epics')
export class EpicController {
  constructor(private readonly epicService: EpicService,  @Inject(EPIC_EXCHANGE) private readonly client: ClientProxy) {}

  @Post("hello")
  async getHello(@Body() body: any) {
    return this.client.send('hello', body);
  }
  
  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  create(@Body() createEpicDto: CreateEpicDto) {
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
