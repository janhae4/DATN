import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateTaskDto, UpdateTaskDto, LABEL_CLIENT, LABEL_PATTERNS } from '@app/contracts';
import { Task } from '@app/contracts/task/entity/task.entity';
import { RabbitSubscribe, Nack, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE, LABEL_EXCHANGE, RPC_TIMEOUT } from '@app/contracts/constants';
import { LabelEvent } from '@app/contracts/events/label.event';
import { Label } from '@app/contracts/label/entity/label.entity';
import { TaskLabel as TaskLabelEvent } from '@app/contracts/events/task-label.event';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TasksService {

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
    private readonly amqpConnection: AmqpConnection,
    @Inject(LABEL_CLIENT) private readonly labelClient: ClientProxy,
  ) { }




  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { listId, position, labelIds, ...rest } = createTaskDto; //

    let newPosition = position;
    if (!newPosition) {
      const lastTask = await this.taskRepository.findOne({
        where: { listId },
        order: { position: 'DESC' }, // Lấy cái cao nhất
        select: ['position'],
      });
      newPosition = lastTask ? lastTask.position + 65535 : 65535;
    }


    const newTask = this.taskRepository.create({ ...rest, listId, position: newPosition });
    const savedTask = await this.taskRepository.save(newTask);

    if (labelIds) {
      await this.assignLabels(savedTask.id, labelIds);
    }

    return this.findOne(savedTask.id);
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



  // task-service/src/tasks/tasks.service.ts

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<any> {
    const { labelIds, ...updates } = updateTaskDto;
    const task = await this.findOne(id);

    const updatedTask = this.taskRepository.merge(task, updates);
    await this.taskRepository.save(updatedTask);
    if (labelIds !== undefined) {
      console.log("labelIds while update ", labelIds)
      await this.assignLabels(id, labelIds);
      return this.findLabelsByTaskId(id)
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return { success: true };
  }


  // task-service/src/tasks/tasks.service.ts

  private async assignLabels(taskId: string, labelIds: string[]) {
    if (labelIds && labelIds.length > 0) {
      try {

        const labels = await lastValueFrom(
          this.labelClient.send<Label[]>(TaskLabelEvent.GET_DETAILS, { labelIds  })
        );

        console.log("labels------------ ", labels)

        if (labels && Array.isArray(labels) && labels.length > 0) {
          const newLinks = labels.map(label => {
            const link = new TaskLabel();
            link.taskId = taskId;
            link.labelId = label.id;
            link.name = label.name; 
            link.projectId = label.projectId;
            link.color = label.color; 
            return link;
          });


          await this.taskLabelRepository.save(newLinks);
        }
      } catch (error) {
        // Nếu RPC lỗi (Label Service chết), ta log lại nhưng KHÔNG crash flow tạo Task.
        // Task vẫn được tạo nhưng tạm thời không có label (Fail-safe).
        console.error('Error fetching label details via RPC:', error);
      }
    }
  }



  async findLabelsByTaskId(taskId: string): Promise<TaskLabel[]> {
    return this.taskLabelRepository.find({
      where: { taskId },
    });
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
    return this.taskRepository.update({ sprintId }, { sprintId: null });
  }



  async handleLabelDeleted(payload: { id: string }) {
    try {
      await this.taskLabelRepository.delete({ labelId: payload.id });

      console.log(`Deleted relations for label ${payload.id}`);
    } catch (error) {
      console.error('Error handling label deleted:', error);
      return new Nack(true);
    }
  }

  async handLabelUpdate(label: Label) {
    try {
      await this.taskLabelRepository.update(
        { labelId: label.id },
        { name: label.name, color: label.color },
      );
    } catch (error) {
      return new Nack(true);
    }
  }




  async getAllTaskLabel(projectId: string){
    try{
      return this.taskLabelRepository.find({
        where: { projectId },
      });
    }
    catch(error){
      console.error('Error handling label deleted:', error);
      return new Nack(true);
    }
  }
}
