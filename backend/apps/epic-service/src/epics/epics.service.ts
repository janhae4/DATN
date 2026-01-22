import { Injectable } from '@nestjs/common';
import { CreateEpicDto, Epic, MemberRole, UpdateEpicDto } from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TeamCacheService } from '@app/redis-service';

@Injectable()
export class EpicsService {
  constructor(
    @InjectRepository(Epic)
    private readonly epicRepository: Repository<Epic>,
    private readonly teamCache: TeamCacheService
  ) { }

  async create(createEpicDto: CreateEpicDto, userId: string) {
    await this.teamCache.checkPermission(createEpicDto.teamId, userId, [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER]);
    const existingEpic = await this.epicRepository.findOne({
      where: {
        projectId: createEpicDto.projectId,
        title: ILike(createEpicDto.title.trim())
      }
    })

    if (existingEpic) return existingEpic;

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
    });
  }

  update(epicId: string, updateEpicDto: UpdateEpicDto) {
    return this.epicRepository.update(epicId, updateEpicDto);
  }

  remove(epicId: string) {
    return this.epicRepository.delete(epicId);
  }
}
