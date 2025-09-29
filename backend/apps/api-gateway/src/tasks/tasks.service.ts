import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_PATTERNS } from '@app/contracts/task/task.patterns';
import { TaskErrorCode } from '@app/contracts/task/task.errors';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TASK_CLIENT } from '@app/contracts/constants';

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
      catchError((err) => {
        if (err?.code === TaskErrorCode.TASK_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.client
      .send(TASK_PATTERNS.UPDATE, { id, data: updateTaskDto })
      .pipe(
        catchError((err) => {
          if (err?.code === TaskErrorCode.TASK_NOT_FOUND) {
            return throwError(() => new NotFoundException(err.message));
          }
          return throwError(() => err);
        }),
      );
  }

  remove(id: number) {
    return this.client.send(TASK_PATTERNS.REMOVE, { id }).pipe(
      catchError((err) => {
        if (err?.code === TaskErrorCode.TASK_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }
}
