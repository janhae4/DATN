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
  MessageEvent,
  Inject,
  Patch,
} from '@nestjs/common';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ApprovalStatus,
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
import { TaskService } from './task.service';
import { map, Observable } from 'rxjs';
import Redis from 'ioredis';
import { FileService } from '../file/file.service';
import { ApiBody } from '@nestjs/swagger';
import { BaseTaskFilterDto } from './dto/get-task-filter.dto';
import { REDIS_CLIENT } from '@app/redis-service/redis.constant';

@Controller('tasks')
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly fileService: FileService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) { }

  @Get(":teamId/tasklabel")
  getAllTaskLabel(
    @Param('teamId') teamId: string,
    @Query('projectId') projectId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.taskService.getAllTaskLabel(projectId, teamId, userId);
  }

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser('id') id: string,) {
    let approvalStatus = ApprovalStatus.PENDING;
    return this.taskService.create({ ...createTaskDto, reporterId: id, approvalStatus });
  }

  @Post('bulk')
  createBulk(
    @Body() data: { tasks: CreateTaskDto[], epicTitle: string },
    @CurrentUser('id') id: string
  ) {
    return this.taskService.createMany(data.tasks, data.epicTitle, id);
  }

  @Delete('bulk')
  deleteBulk(
    @Body() data: { taskIds: string[], teamId: string },
    @CurrentUser('id') id: string
  ) {
    return this.taskService.deleteMany(data.taskIds, id, data.teamId);
  }

  @Patch('bulk')
  updateBulk(
    @Body() data: { taskIds: string[], updates: UpdateTaskDto, teamId: string },
    @CurrentUser('id') id: string
  ) {
    return this.taskService.updateMany(data.taskIds, data.updates, id, data.teamId);
  }

  @Get()
  findAllByProjectId(
    @CurrentUser('id') userId: string,
    @Query() filters: BaseTaskFilterDto,
  ) {
    console.log('filters', filters)
    return this.taskService.findAllByProjectId(userId, filters);
  }

  @Get('/project/:projectId/stat')
  findAllByProject(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskService.getStatByProjectId(userId, projectId);
  }

  @Get('by-team')
  findAllByTeamId(
    @Query() filters: BaseTaskFilterDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskService.findAllByTeamId(userId, filters);
  }

  @Get('assign-to-me')
  findAllAssignToMe(
    @Query() filters: BaseTaskFilterDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskService.findAllAssignToMe(userId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser('id') userId: string
  ) {
    return this.taskService.update(id, updateTaskDto, userId);
  }

  @Delete(':teamId/:id')
  async remove(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.taskService.remove(id, teamId, userId);
  }

  @Post(':id/files')
  async addFiles(
    @Param('id') taskId: string,
    @Body() addFilesDto: { fileIds: string[] },
    @CurrentUser('id') userId: string
  ) {
    return this.taskService.addFiles(taskId, addFilesDto.fileIds, userId);
  }

  @Delete(':id/files/:fileId')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  async removeFile(
    @Param('id') taskId: string,
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.taskService.removeFile(taskId, fileId, userId);
  }

  @Get(':id/files')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  async getTaskFiles(@Param('id') taskId: string, @CurrentUser('id') userId: string) {
    const task = await this.taskService.findOne(taskId);
    if (!task || !task.fileIds || task.fileIds.length === 0) {
      return [];
    }
    return this.fileService.getFilesByIds(task.fileIds, userId);
  }

  @Get(":id/labels")
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  findLabelsByTaskId(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.taskService.findLabelsByTaskId(taskId, userId);
  }

  @Delete(":id/label")
  handleLabelDeleted(@Query('labelId') labelId: string, @CurrentUser('id') userId: string) {
    return this.taskService.handleLabelDeleted(labelId, userId);
  }

  @Post('suggest-stream')
  @Sse('suggest-stream')
  @ApiBody({
    type: 'object',
    schema: {
      properties: {
        query: { type: 'string' },
        projectId: { type: 'string' },
        teamId: { type: 'string' },
        sprintId: { type: 'string' }
      }
    }
  })
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
        if (data.type === 'summarized') {
          return {
            data: {
              type: 'summarized',
              objective: data.objective,
            },
          } as MessageEvent;
        }

        const isNoSprint = !sprintId || sprintId === "";

        let assignedMemberId = data.memberId;
        if (isNoSprint || !data.memberId || data.memberId === 'self') {
          assignedMemberId = userId;
        }

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
