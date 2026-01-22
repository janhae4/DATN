import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSprintDto,
  SprintStatus,
  UpdateSprintDto,
  TASK_EXCHANGE,
  TASK_PATTERNS,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  MemberRole,
  BadRequestException,
} from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Sprint } from '@app/contracts/sprint/entity/sprint.entity';
import { RmqClientService } from '@app/common';
import { TeamCacheService } from '@app/redis-service';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    private readonly amqpConnection: RmqClientService,
    private readonly teamCache: TeamCacheService
  ) { }

  async create(createSprintDto: CreateSprintDto) {
    if (!createSprintDto.teamId || !createSprintDto.userId) {
      throw new BadRequestException('Team ID and User ID is required');
    }

    await this.teamCache.checkPermission(
      createSprintDto.teamId,
      createSprintDto.userId,
    )

    const sprintData: Partial<Sprint> = {
      title: createSprintDto.title,
      goal: createSprintDto.goal,
      projectId: createSprintDto.projectId,
      startDate: createSprintDto.start_date
        ? new Date(createSprintDto.start_date)
        : undefined,
      endDate: createSprintDto.end_date
        ? new Date(createSprintDto.end_date)
        : undefined,
      teamId: createSprintDto.teamId,
    };
    const sprint = this.sprintRepository.create(sprintData);
    return this.sprintRepository.save(sprint);
  }

  async findAllByProjectId(projectId: string) {
    return this.sprintRepository.find({
      where: { projectId },
      order: { startDate: 'DESC' },
    });
  }

  async findOneById(id: string) {
    const sprint = await this.sprintRepository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found`);
    }
    return sprint;
  }

  async update(id: string, updateSprintDto: UpdateSprintDto) {
    await this.findOneById(id);
    if (updateSprintDto.status === SprintStatus.COMPLETED) {
      this.amqpConnection.publish(
        TASK_EXCHANGE,
        TASK_PATTERNS.COMPLETE_SPRINT,
        { sprintId: id, projectId: updateSprintDto.projectId },
      );
    }

    const { start_date, end_date, ...rest } = updateSprintDto;
    const dataToUpdate: Partial<Sprint> = {
      ...rest,
      status: rest.status as Sprint['status'],
    };
    if (start_date) {
      dataToUpdate.startDate = new Date(start_date);
    }
    if (end_date) {
      dataToUpdate.endDate = new Date(end_date);
    }

    await this.sprintRepository.update(id, dataToUpdate);
    return this.findOneById(id);
  }

  async remove(id: string) {
    await this.findOneById(id);

    this.amqpConnection.publish(
      TASK_EXCHANGE,
      TASK_PATTERNS.UNASSIGN_TASKS_FROM_SPRINT,
      {
        sprintId: id,
      },
    );

    await this.sprintRepository.delete(id);
    return { message: `Sprint ${id} deleted successfully` };
  }

  async getActiveSprint(projectId: string) {
    return this.sprintRepository.findOne({
      where: {
        projectId,
        status: SprintStatus.ACTIVE,
      },
    });
  }

  async startSprint(id: string) {
    const sprintToStart = await this.findOneById(id);

    const activeSprint = await this.sprintRepository.findOne({
      where: {
        projectId: sprintToStart.projectId,
        status: SprintStatus.ACTIVE,
        id: Not(id),
      },
    });

    if (activeSprint) {
      throw new BadRequestException(
        'An active sprint already exists in this project. Complete it before starting a new one.',
      );
    }

    await this.sprintRepository.update(id, { status: SprintStatus.ACTIVE });
    return this.findOneById(id);
  }

  async findAll(projectId: string, userId: string, teamId: string, status?: SprintStatus[]) {
    if (!projectId || !teamId) {
      throw new BadRequestException('Project ID and Team ID are required');
    }

    await this.teamCache.checkPermission(teamId, userId);

    const query = this.sprintRepository.createQueryBuilder('sprint')
      .where('sprint.projectId = :projectId', { projectId })
      .andWhere('sprint.teamId = :teamId', { teamId });

    if (status && status.length > 0) {
      const statusArray = Array.isArray(status) ? status : [status];
      query.andWhere('sprint.status IN (:...status)', { status: statusArray });
    }

    const sprints = await query
      .orderBy('sprint.startDate', 'DESC')
      .getMany();

    if (sprints.length === 0) {
      throw new NotFoundException(`No sprints found for project ID ${projectId}`);
    }

    return sprints;
  }
}