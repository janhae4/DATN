import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateTaskDto, UpdateTaskDto } from '@app/contracts';
import { Task } from '@app/contracts/task/entity/task.entity';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@app/contracts/constants';
import { LabelEvent } from '@app/contracts/events/label.event';
import { Label } from '@app/contracts/label/entity/label.entity';
import { TaskLabel } from '../entities/task-label.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { listId, position } = createTaskDto; //

    let newPosition = position;

    // Nếu client không gửi position (hoặc gửi null), ta tự tính để đưa xuống cuối
    if (!newPosition) {
      // 1. Tìm task đang nằm cuối cùng trong list này
      const lastTask = await this.taskRepository.findOne({
        where: { listId },
        order: { position: 'DESC' }, // Lấy cái cao nhất
        select: ['position'],
      });

      // 2. Tính position mới
      // Nếu chưa có task nào, mặc định là 65535
      // Nếu có rồi, cộng thêm 65535 (hoặc 1 đơn vị bất kỳ, miễn là tăng lên)
      newPosition = lastTask ? lastTask.position + 65535 : 65535;
    }

    const taskData = {
      ...createTaskDto,
      position: newPosition,
    };

    const newTask = this.taskRepository.create(taskData);
    return this.taskRepository.save(newTask);
  }
  async findAllByProject(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  async findAllBySprint(sprintId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { sprintId },
      order: { position: 'ASC' },
    });
  }

  async findAllByList(listId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { listId },
      order: { position: 'ASC' },
    });
  }

  async findAllByReporter(reporterId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { reporterId },
      order: { position: 'ASC' },
    });
  }

  async findAllByBackLogs(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId, sprintId: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }



  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    const updatedTask = this.taskRepository.merge(task, updateTaskDto);
    return this.taskRepository.save(updatedTask);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return { success: true };
  }



  async moveIncompleteTasksToBacklog(
    sprintId: string,
    backlogStatusId: string,
  ) {
    // This method would be called when a sprint is completed.
    // It finds all tasks in the sprint that are not 'done' and moves them.
    // This requires knowing which status categories are considered "incomplete".
    // For simplicity, we assume anything not in the 'done' category is incomplete.
    // This logic would likely live in the sprint-service and call the task-service.
    // This is a placeholder for that interaction.
    return this.taskRepository.update(
      { sprintId /*, status: { category: Not('done') } */ },
      { sprintId: null, listId: backlogStatusId },
    );
  }



  async unassignTasksFromSprint(sprintId: string) {
    // This would be called if a sprint is deleted or archived.
    return this.taskRepository.update({ sprintId }, { sprintId: null });
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: LabelEvent.UPDATED,
    queue: 'task-service.label.updated',
  })
  async handleLabelUpdated(label: Label) {
    try {
      await this.taskLabelRepository.update(
        { labelId: label.id },
        { labelName: label.name, labelColor: label.color },
      );
    } catch (error) {
      // Negative acknowledgement to requeue the message for another try
      return new Nack(true);
    }
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: LabelEvent.DELETED,
    queue: 'task-service.label.deleted',
  })
  async handleLabelDeleted(payload: { id: string }) {
    try {
      // Batch delete to avoid locking the database for too long
      await this.taskLabelRepository.delete({ labelId: payload.id });
    } catch (error) {
      return new Nack(true);
    }
  }
}
