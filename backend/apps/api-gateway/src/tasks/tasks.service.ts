import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_PATTERNS } from '@app/contracts/task/task.patterns';
import { TaskErrorCode } from '@app/contracts/task/task.errors';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TASK_CLIENT } from '@app/contracts/constants';
import { CreateTaskDto } from '@app/contracts/task/create-task.dto';
import { UpdateTaskDto } from '@app/contracts/task/update-task.dto';
import { Request } from 'express';
import { RequestGoogleTaskDto } from '@app/contracts/task/request-google-task.dto';

interface RpcError {
  code?: TaskErrorCode;
  message?: string;
}

@Injectable()
export class TasksService {
  constructor(@Inject(TASK_CLIENT) private readonly client: ClientProxy) {}

  create(createTaskDto: CreateTaskDto) {
    return this.client.send(TASK_PATTERNS.CREATE, createTaskDto);
  }

  findAll() {
    return this.client.send(TASK_PATTERNS.FIND_ALL, {});
  }

  findOne(id: number) {
    return this.client.send(TASK_PATTERNS.FIND_ONE, { id }).pipe(
      catchError((err: RpcError) => {
        if (err.code === TaskErrorCode.TASK_NOT_FOUND) {
          return throwError(
            () => new NotFoundException(err.message ?? 'Task not found'),
          );
        }
        return throwError(() => err);
      }),
    );
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.client
      .send(TASK_PATTERNS.UPDATE, { id, data: updateTaskDto })
      .pipe(
        catchError((err: RpcError) => {
          if (err.code === TaskErrorCode.TASK_NOT_FOUND) {
            return throwError(
              () => new NotFoundException(err.message ?? 'Task not found'),
            );
          }
          return throwError(() => err);
        }),
      );
  }

  remove(id: number) {
    return this.client.send(TASK_PATTERNS.REMOVE, { id }).pipe(
      catchError((err: RpcError) => {
        if (err.code === TaskErrorCode.TASK_NOT_FOUND) {
          return throwError(
            () => new NotFoundException(err.message ?? 'Task not found'),
          );
        }
        return throwError(() => err);
      }),
    );
  }

  findGoogleEvents(request: Request) {
    const cookies = request.cookies;
    const data: RequestGoogleTaskDto = {
      accessToken: cookies.accessToken as string,
      refreshToken: cookies.refreshToken as string,
    };
    console.log(data);
    return this.client.send(TASK_PATTERNS.FIND_GOOGLE_EVENTS, data);
  }
}
