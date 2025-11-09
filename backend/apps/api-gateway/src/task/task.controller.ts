import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Param, 
  Put, 
  Delete 
} from '@nestjs/common';
import { 
  CreateTaskDto, 
  UpdateTaskDto 
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get('project/:projectId')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findAllByProjectId(
    @Param('projectId') projectId: string,
  ) {
    return this.taskService.findAllByProjectId(projectId);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findOne(
    @Param('id') id: string,
  ) {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  remove(
    @Param('id') id: string,
  ) {
    return this.taskService.remove(id);
  }
}
