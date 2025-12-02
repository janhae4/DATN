import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateEpicDto, UpdateEpicDto, EPIC_PATTERNS, EPIC_EXCHANGE } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';
import { firstValueFrom } from 'rxjs'; 

@Injectable()
export class EpicService {
  constructor(
    @Inject(EPIC_EXCHANGE) private readonly client: ClientProxy,
  ) {}

  

  async create(createEpicDto: CreateEpicDto) {
    console.log("create epic in gateway: ", createEpicDto);
    // Sử dụng firstValueFrom để đợi kết quả từ Observable
    const result = await firstValueFrom(
      this.client.send(EPIC_PATTERNS.CREATE, createEpicDto)
    );
    return unwrapRpcResult(result);
  }

  async findAllByProjectId(projectId: string) {
    const result = await firstValueFrom(
      this.client.send(EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID, { projectId })
    );
    return unwrapRpcResult(result);
  }

  async findOne(id: string) {
    const result = await firstValueFrom(
      this.client.send(EPIC_PATTERNS.FIND_ONE_BY_ID, { epicId: id })
    );
    return unwrapRpcResult(result);
  }

  async update(id: string, updateEpicDto: UpdateEpicDto) {
    const result = await firstValueFrom(
      this.client.send(EPIC_PATTERNS.UPDATE, { epicId: id, updateEpicDto })
    );
    return unwrapRpcResult(result);
  }

  async remove(id: string) {
    const result = await firstValueFrom(
      this.client.send(EPIC_PATTERNS.REMOVE, { epicId: id })
    );
    return unwrapRpcResult(result);
  }
}