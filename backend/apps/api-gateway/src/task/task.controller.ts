import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Put,
  Delete,
  Query,
  Sse,
  Req,
  MessageEvent,
  Inject
} from '@nestjs/common';
import {
  CreateTaskDto,
  REDIS_CLIENT,
  UpdateTaskDto
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
import { TaskService } from './task.service';
import { finalize, map, Observable } from 'rxjs';
import type { Request } from 'express';
import Redis from 'ioredis';

@Controller('tasks')
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class TaskController {
  constructor(private readonly taskService: TaskService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) { }

  @Get("tasklabel")
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  getAllTaskLabel(@Query('projectId') projectId: string) {
    return this.taskService.getAllTaskLabel(projectId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser('id') id: string,) {
    return this.taskService.create({ ...createTaskDto, reporterId: id });
  }

  @Post('bulk')
  createBulk(@Body() data: { tasks: CreateTaskDto[], epicTitle: string }) {
    return this.taskService.createMany(data.tasks, data.epicTitle);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findAllByProjectId(
    @Query('projectId') projectId: string,
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

  @Post(':id/files')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  addFiles(
    @Param('id') taskId: string,
    @Body() addFilesDto: { fileIds: string[] },
  ) {
    return this.taskService.addFiles(taskId, addFilesDto.fileIds);
  }

  @Get(":id/labels")
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findLabelsByTaskId(
    @Param('id') taskId: string,
  ) {
    return this.taskService.findLabelsByTaskId(taskId);
  }

  @Delete(":id/label")
  handleLabelDeleted(@Query('labelId') labelId: string) {
    return this.taskService.handleLabelDeleted({ labelId });
  }

  @Post('suggest-stream')
  @Sse('suggest-stream')
  async sse(
    @Body() { query, projectId, teamId, sprintId }: { query: string; projectId: string; teamId: string, sprintId: string },
    @CurrentUser('id') userId: string
  ): Promise<Observable<MessageEvent>> {

    await this.taskService.suggestTask(userId, query, projectId, sprintId, teamId);

    return new Observable<any>((observer) => {
      const redisSub = this.redis.duplicate();
      const channel = `task_suggest:${userId}`;
      redisSub.subscribe(channel);

      redisSub.on('message', (chan, message) => {
        if (chan === channel) {
          try {
            const data = JSON.parse(message);
            observer.next(data);
            if (data.type === 'done' || data.type === 'error') {
              observer.complete();
            }
          } catch (e) {
            console.error("Error parsing Redis message", e);
          }
        }
      });

      redisSub.on('error', (err) => {
        console.error('Redis Sub Error:', err);
        observer.error(err);
      });

      redisSub.subscribe(channel, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${channel}:`, err.message);
          observer.error(err);
        }
      });

      return () => {
        redisSub.quit();
      };
    }).pipe(
      map((data) => {
        const isNoSprint = !sprintId || sprintId === "";

        let assignedMemberId = data.memberId;
        if (isNoSprint || !data.memberId || data.memberId === 'self') {
          assignedMemberId = userId;
        }

        console.log("assignedMemberId", assignedMemberId)

        return {
          data: {
            title: data.title,
            memberId: assignedMemberId,
            skillName: data.skillName,
            experience: data.experience,
            reason: data.reason,
            startDate: data.startDate,
            dueDate: data.dueDate,
            type: data.type,
            message: data.message
          }
        } as MessageEvent
      }),
    );
  }
}
