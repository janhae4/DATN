import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    // Here you would generate the `task_key` (e.g., "PROJ-123")
    // This requires fetching the project key and the latest task number for that project.
    // This logic is complex and depends on other services, so for now, we'll use a placeholder.
    const task_key = await this.generateTaskKey(createTaskDto.projectId);

    const taskData = {
      ...createTaskDto,
      task_key,
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

  private async generateTaskKey(projectId: string): Promise<string> {
    // In a real implementation, you would:
    // 1. Call the project-service to get the project's `key` (e.g., "DEV").
    // 2. Query the task repository to find the highest task number for that project.
    // 3. Increment the number and combine them: "DEV-101".

    // For now, a simplified placeholder:
    const count = await this.taskRepository.count({ where: { projectId } });
    // This is NOT robust and is for demonstration only.
    // A dedicated sequence or a call to another service is needed.
    return `TASK-${count + 1}`;
  }

  async moveIncompleteTasksToBacklog(sprintId: string, backlogStatusId: string) {
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