import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateSprintDto, PROJECT_CLIENT, SPRINT_PATTERNS } from '@app/contracts';

@Injectable()
export class SprintService {
  constructor(
    @Inject(PROJECT_CLIENT) private readonly projectClient: ClientProxy,
  ) {}

  async create(createSprintDto: CreateSprintDto) {
    return firstValueFrom(
      this.projectClient.send(SPRINT_PATTERNS.CREATE, {
        createSprintDto,
      }),
    );
  }

  async findAllByProjectId(projectId: string, userId: string) {
    return firstValueFrom(
      this.projectClient.send(SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID, {
        projectId,
        userId,
      }),
    );
  }

  async findOne(id: string, userId: string) {
    return firstValueFrom(
      this.projectClient.send(SPRINT_PATTERNS.FIND_ONE_BY_ID, {
        id,
        userId,
      }),
    );
  }
}
