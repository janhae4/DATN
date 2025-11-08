import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_CLIENT,
  PROJECT_PATTERNS,
} from '@app/contracts';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ProjectErrorCode } from '@app/contracts/project/project.errors';

@Injectable()
export class ProjectService implements OnModuleInit { 
  constructor(
    @Inject(PROJECT_CLIENT) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() { 
    await this.client.connect();
    console.log('Project Client (API-Gateway) connected to RMQ');
  }

  // --- CREATE ---
  create(createProjectDto: CreateProjectDto) {
    console.log("createProjectDto in API",createProjectDto);
    return this.client.send(PROJECT_PATTERNS.CREATE, createProjectDto);
  }

  // --- READ ---
  findOne(id: string) {
    return this.client.send(PROJECT_PATTERNS.GET_BY_ID, { id }).pipe(
      catchError((err) => {
        if (err?.code === ProjectErrorCode.PROJECT_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  // --- UPDATE ---
  update(id: string, updateProjectDto: UpdateProjectDto) {
    console.log(updateProjectDto);
    return this.client.send(PROJECT_PATTERNS.UPDATE, { id, updateProjectDto }).pipe(
      catchError((err) => {
        if (err?.code === ProjectErrorCode.PROJECT_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  // --- DELETE ---
  remove(id: string) {
    console.log(id);
    return this.client.send(PROJECT_PATTERNS.REMOVE, { id }).pipe(
      catchError((err) => {
        if (err?.code === ProjectErrorCode.PROJECT_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }
}