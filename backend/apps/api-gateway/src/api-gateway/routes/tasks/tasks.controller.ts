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
import { CreateTaskDto } from '@app/contracts/task/create-task.dto';
import { UpdateTaskDto } from '@app/contracts/task/update-task.dto';
import type { Request } from 'express';
import { RoleGuard } from 'apps/api-gateway/src/common/role/role.guard';
import { Roles } from 'apps/api-gateway/src/common/role/role.decorator';
import { Role } from '@app/contracts/user/user.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
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
