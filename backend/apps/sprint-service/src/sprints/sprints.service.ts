import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateSprintDto,
  SprintStatus,
  UpdateSprintDto,
  TASK_EXCHANGE,
  TASK_PATTERNS,
} from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Sprint } from '@app/contracts/sprint/entity/sprint.entity';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async create(createSprintDto: CreateSprintDto) {
    // Permission checks should be done in the API Gateway.
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
    };
    const sprint = this.sprintRepository.create(sprintData);
    return this.sprintRepository.save(sprint);
  }

  async findAllByProjectId(projectId: string) {
    // The new architecture separates concerns. The sprint-service only manages sprints.
    // To get tasks within a sprint, the client (e.g., API Gateway) will need to make a separate call to the task-service.
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
    // Similar to findAll, task details are handled by the task-service.
    return sprint;
  }

  async update(id: string, updateSprintDto: UpdateSprintDto) {
    // Permission checks are assumed to be handled upstream.
    await this.findOneById(id); // Ensures sprint exists

    if (updateSprintDto.status === SprintStatus.COMPLETED) {
      // When a sprint is completed, we notify the task-service to handle moving incomplete tasks.
      this.amqpConnection.publish(
        TASK_EXCHANGE,
        TASK_PATTERNS.MOVE_INCOMPLETE_TASKS_TO_BACKLOG,
        { sprintId: id },
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
    // Permission check upstream.
    await this.findOneById(id); // Ensures sprint exists

    // Notify task-service to un-assign tasks from this sprint before deleting it.
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
    // Permission check upstream.
    return this.sprintRepository.findOne({
      where: {
        projectId,
        status: SprintStatus.ACTIVE,
      },
    });
  }

  async startSprint(id: string) {
    // Permission check upstream.
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
}