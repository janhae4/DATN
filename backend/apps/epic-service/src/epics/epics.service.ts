import { Injectable } from '@nestjs/common';
import { CreateEpicDto, Epic, UpdateEpicDto } from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EpicsService {
  constructor(
    @InjectRepository(Epic)
    private readonly epicRepository: Repository<Epic>,
  ) {}

  create(createEpicDto: CreateEpicDto) {
    const epic = this.epicRepository.create(createEpicDto);
    return this.epicRepository.save(epic);
  }

  findAllByProject(projectId: string) {
    return this.epicRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(epicId: string) {
    return this.epicRepository.findOne({
      where: { id: epicId },
      // TypeORM doesn't automatically include relations like Prisma.
      // You need to define the relation in the entity and use `relations: ['tasks']` here if needed.
      // For now, I'm omitting it as the Task entity is in another service.
    });
  }

  update(epicId: string, updateEpicDto: UpdateEpicDto) {
    return this.epicRepository.update(epicId, updateEpicDto);
  }

  remove(epicId: string) {
    return this.epicRepository.delete(epicId);
  }
}
