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
  Inject,
  Patch,
  ForbiddenException
} from '@nestjs/common';
import {
  CreateTaskDto,
  REDIS_CLIENT,
  UpdateTaskDto,
  ApprovalStatus
} from '@app/contracts';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { Role, MemberRole, PROJECT_EXCHANGE, PROJECT_PATTERNS } from '@app/contracts';
import { TaskService } from './task.service';
import { map, Observable, firstValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { GetTasksByProjectDto, GetTasksByTeamDto } from './dto/get-task-filter.dto';
import { FileService } from '../file/file.service';
import { TeamService } from '../team/team.service';
import { ClientProxy } from '@nestjs/microservices';
import { unwrapRpcResult } from '../common/helper/rpc';

@Controller('tasks')
@UseGuards(RoleGuard)
@Roles(Role.USER, Role.ADMIN)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly fileService: FileService,
    private readonly teamService: TeamService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(PROJECT_EXCHANGE) private readonly projectClient: ClientProxy,
  ) { }

  @Get("tasklabel")
  getAllTaskLabel(@Query('projectId') projectId: string) {
    return this.taskService.getAllTaskLabel(projectId);
  }

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser('id') id: string,) {
    let approvalStatus = ApprovalStatus.PENDING;

    if (createTaskDto.projectId) {
      const project = unwrapRpcResult(await firstValueFrom(
        this.projectClient.send(PROJECT_PATTERNS.GET_BY_ID, { id: createTaskDto.projectId })
      ));

      if (project && project.teamId) {
        try {
          // Check if Owner/Admin
          await this.teamService.verifyPermission(id, project.teamId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
          ]);
          // If success, auto-approve
          approvalStatus = ApprovalStatus.APPROVED;
        } catch (e) {
          // If Member, keep PENDING
          await this.teamService.verifyPermission(id, project.teamId, [
            MemberRole.MEMBER
          ]);
        }
      }
    }

    if (createTaskDto.assigneeIds && createTaskDto.assigneeIds.length > 0) {
      if (createTaskDto.projectId) {
        if (approvalStatus !== ApprovalStatus.APPROVED) {
          if (createTaskDto.assigneeIds.some(assigneeId => assigneeId !== id)) {
            throw new ForbiddenException("Members cannot assign tasks to others.");
          }
        }
      }
    }
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
    @Body() data: { taskIds: string[] },
    @CurrentUser('id') id: string
  ) {
    return this.taskService.deleteMany(data.taskIds, id);
  }

  @Patch('bulk')
  updateBulk(
    @Body() data: { taskIds: string[], updates: UpdateTaskDto },
    @CurrentUser('id') id: string
  ) {
    return this.taskService.updateMany(data.taskIds, data.updates, id);
  }

  @Get()
  findAllByProjectId(
    @CurrentUser('id') userId: string,
    @Query() filters: GetTasksByProjectDto
  ) {
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
    @Query() filters: GetTasksByTeamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskService.findAllByTeamId(userId, filters);
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
    const task = await this.taskService.findOne(id);
    if (task && task.projectId) {
      const project = unwrapRpcResult(await firstValueFrom(
        this.projectClient.send(PROJECT_PATTERNS.GET_BY_ID, { id: task.projectId })
      ));
      if (project && project.teamId) {
        let isOwnerOrAdmin = false;
        try {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.OWNER,
            MemberRole.ADMIN
          ]);
          isOwnerOrAdmin = true;
        } catch (e) {
          isOwnerOrAdmin = false;
        }

        if (!isOwnerOrAdmin) {
          // Check if user is Member
          await this.teamService.verifyPermission(userId, project.teamId, [MemberRole.MEMBER]);

          // Constraint: Cannot change approvalStatus status
          if (updateTaskDto.approvalStatus !== undefined) {
            throw new ForbiddenException("Only Owner/Admin can approve tasks.");
          }

          // Constraint: Cannot change assignees
          if (updateTaskDto.assigneeIds) {
            throw new ForbiddenException("Members cannot change assignees.");
          }

          // Constraint: Task must be approved to be edited
          if (task.approvalStatus !== ApprovalStatus.APPROVED) {
            throw new ForbiddenException("Task must be approved before it can be edited.");
          }

          // Constraint: Must be creator or assigned
          const isReporter = task.reporterId === userId;
          const isAssignee = task.assigneeIds && task.assigneeIds.includes(userId);

          if (!isReporter && !isAssignee) {
            throw new ForbiddenException("You can only edit tasks you created or are assigned to.");
          }
        }
      }
    }
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const task = await this.taskService.findOne(id);
    if (task && task.projectId) {
      const project = unwrapRpcResult(await firstValueFrom(
        this.projectClient.send(PROJECT_PATTERNS.GET_BY_ID, { id: task.projectId })
      ));
      if (project && project.teamId) {
        try {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
          ]);
        } catch (e) {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.MEMBER
          ]);

          if (task.approvalStatus === ApprovalStatus.REJECTED && task.reporterId === userId) {
          } else {
            throw new ForbiddenException("Only Owner or Admin can delete tasks, unless it is a rejected task you created.");
          }
        }
      }
    }
    return this.taskService.remove(id);
  }

  @Post(':id/files')
  async addFiles(
    @Param('id') taskId: string,
    @Body() addFilesDto: { fileIds: string[] },
    @CurrentUser('id') userId: string
  ) {
    const task = await this.taskService.findOne(taskId);
    if (task && task.projectId) {
      const project = unwrapRpcResult(await firstValueFrom(
        this.projectClient.send(PROJECT_PATTERNS.GET_BY_ID, { id: task.projectId })
      ));
      if (project && project.teamId) {
        try {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
          ]);
        } catch (e) {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.MEMBER
          ]);
          if (!task.assigneeIds || !task.assigneeIds.includes(userId)) {
            throw new ForbiddenException("You can only add files to tasks you are assigned to.");
          }
        }
      }
    }
    return this.taskService.addFiles(taskId, addFilesDto.fileIds);
  }

  @Delete(':id/files/:fileId')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  async removeFile(
    @Param('id') taskId: string,
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string
  ) {
    const task = await this.taskService.findOne(taskId);
    if (task && task.projectId) {
      const project = unwrapRpcResult(await firstValueFrom(
        this.projectClient.send(PROJECT_PATTERNS.GET_BY_ID, { id: task.projectId })
      ));
      if (project && project.teamId) {
        try {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
          ]);
        } catch (e) {
          await this.teamService.verifyPermission(userId, project.teamId, [
            MemberRole.MEMBER
          ]);
          if (!task.assigneeIds || !task.assigneeIds.includes(userId)) {
            throw new ForbiddenException("You can only remove files from tasks you are assigned to.");
          }
        }
      }
    }
    return this.taskService.removeFile(taskId, fileId);
  }

  @Get(':id/files')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  async getTaskFiles(@Param('id') taskId: string) {
    const task = await this.taskService.findOne(taskId);
    if (!task || !task.fileIds || task.fileIds.length === 0) {
      return [];
    }
    return this.fileService.getFilesByIds(task.fileIds);
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
