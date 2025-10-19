import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../common/role/role.decorator';
import { CreateTaskDto, JwtDto, Role, UpdateTaskDto } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiBody({ type: CreateTaskDto })
  create(@Req() request: Request, @Body() createTaskDto: CreateTaskDto) {
    const payload = request.user as JwtDto;
    return this.tasksService.create({
      ...createTaskDto,
      userId: payload.id,
    });
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  findByUserId(@Req() request: Request) {
    const payload = request.user as JwtDto;
    return this.tasksService.findByUserId(payload.id);
  }

  @Get('events')
  findGoogleEvents(@Req() request: Request) {
    return this.tasksService.findGoogleEvents(request);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
