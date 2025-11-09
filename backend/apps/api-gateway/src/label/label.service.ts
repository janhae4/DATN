import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { 
  CreateLabelDto, 
  UpdateLabelDto, 
  LABEL_PATTERNS,
  PROJECT_CLIENT,
  LabelErrorCode,
} from '@app/contracts';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LabelService implements OnModuleInit {
  constructor(
    @Inject(PROJECT_CLIENT) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    console.log('Label Client (API-Gateway) connected to RMQ');
  }

  // --- CREATE ---
  create(createLabelDto: CreateLabelDto) {
    return this.client.send(LABEL_PATTERNS.CREATE, { createLabelDto });
  }

  // --- READ ---
  findOne(id: string) {
    return this.client.send(LABEL_PATTERNS.FIND_ONE_BY_ID, { id }).pipe(
      catchError((err) => {
        if (err?.code === LabelErrorCode.LABEL_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  // --- UPDATE ---
  update(id: string, updateLabelDto: UpdateLabelDto) {
    return this.client.send(LABEL_PATTERNS.UPDATE, { id, updateLabelDto }).pipe(
      catchError((err) => {
        if (err?.code === LabelErrorCode.LABEL_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }

  // --- DELETE ---
  remove(id: string) {
    return this.client.send(LABEL_PATTERNS.REMOVE, { id }).pipe(
      catchError((err) => {
        if (err?.code === LabelErrorCode.LABEL_NOT_FOUND) {
          return throwError(() => new NotFoundException(err.message));
        }
        return throwError(() => err);
      }),
    );
  }
}
