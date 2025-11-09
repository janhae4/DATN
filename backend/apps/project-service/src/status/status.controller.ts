import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StatusService } from './status.service';
import { CreateStatusDto, STATUS_PATTERNS, UpdateStatusDto } from '@app/contracts';

@Controller()
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @MessagePattern(STATUS_PATTERNS.CREATE)
  create(@Payload() payload: { createStatusDto: CreateStatusDto }) {
    return this.statusService.create(payload.createStatusDto);
  }

  @MessagePattern(STATUS_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProjectId(@Payload() payload: { projectId: string; userId: string }) {
    return this.statusService.findAllByProject(payload.projectId);
  }

  @MessagePattern(STATUS_PATTERNS.FIND_ONE_BY_ID)
  findOneById(@Payload() payload: { id: string; userId: string }) {
    return this.statusService.findOne(payload.id);
  }

  @MessagePattern(STATUS_PATTERNS.UPDATE)
  update(
    @Payload()
    payload: {
      id: string;
      updateStatusDto: UpdateStatusDto;
      userId: string;
    },
  ) {
    return this.statusService.update(
      payload.id,
      payload.updateStatusDto,
    );
  }

  @MessagePattern(STATUS_PATTERNS.REMOVE)
  remove(@Payload() payload: { id: string; userId: string }) {
    return this.statusService.remove(payload.id, payload.userId);
  }
}
