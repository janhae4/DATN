import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { 
  CreateStatusDto, 
  UpdateStatusDto, 
  STATUS_PATTERNS,
  PROJECT_CLIENT,
  StatusErrorCode,
} from '@app/contracts';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class StatusService implements OnModuleInit {
  constructor(
    @Inject(PROJECT_CLIENT) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    console.log('Status Client (API-Gateway) connected to RMQ');
  }

  // --- CREATE ---
  create(createStatusDto: CreateStatusDto) {
    return this.client.send(STATUS_PATTERNS.CREATE, { createStatusDto });
  }

  // --- READ ---
  findOne(id: string) {
    return this.client.send(STATUS_PATTERNS.FIND_ONE_BY_ID, { id }).pipe(
      catchError((err) => {
        if (err?.code === StatusErrorCode.STATUS_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  // --- UPDATE ---
  update(id: string, updateStatusDto: UpdateStatusDto) {
    return this.client.send(STATUS_PATTERNS.UPDATE, { id, updateStatusDto }).pipe(
      catchError((err) => {
        if (err?.code === StatusErrorCode.STATUS_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  // --- DELETE ---
  remove(id: string) {
    return this.client.send(STATUS_PATTERNS.REMOVE, { id }).pipe(
      catchError((err) => {
        if (err?.code === StatusErrorCode.STATUS_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }
}
