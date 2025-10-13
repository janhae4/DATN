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
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiBody({type: CreateTaskDto})
  create(@Req() request: Request, @Body() createTaskDto: CreateTaskDto) {
    const payload = request.user as JwtDto;

    return this.tasksService.create({
      ...createTaskDto,
      userId: payload.id
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
