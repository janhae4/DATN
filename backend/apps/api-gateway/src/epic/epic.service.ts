import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateEpicDto, UpdateEpicDto, EPIC_PATTERNS, PROJECT_CLIENT } from '@app/contracts';

@Injectable()
export class EpicService {
  constructor(
    @Inject(PROJECT_CLIENT) private readonly projectClient: ClientProxy,
  ) {}

  async create(createEpicDto: CreateEpicDto) {
    return firstValueFrom(
      this.projectClient.send(EPIC_PATTERNS.CREATE, {
        createEpicDto,
      }),
    );
  }

  async findAllByProjectId(projectId: string) {
    return firstValueFrom(
      this.projectClient.send(EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID, {
        projectId,
      }),
    );
  }

  async findOne(id: string) {
    return firstValueFrom(
      this.projectClient.send(EPIC_PATTERNS.FIND_ONE_BY_ID, {
        id,
      }),
    );
  }

  async update(id: string, updateEpicDto: UpdateEpicDto) {
    return firstValueFrom(
      this.projectClient.send(EPIC_PATTERNS.UPDATE, {
        id,
        updateEpicDto,
      }),
    );
  }

  async remove(id: string) {
    return firstValueFrom(
      this.projectClient.send(EPIC_PATTERNS.REMOVE, {
        id,
      }),
    );
  }
}
