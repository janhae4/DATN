import { Test, TestingModule } from '@nestjs/testing';
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskPayloadDto } from './dto/update-task-payload.dto';
import { FindTaskDto } from './dto/find-task.dto';
import { Task } from '../../../generated/prisma';

describe('TaskServiceController', () => {
  let controller: TaskServiceController;
  let service: TaskServiceService;

  const mockTask: Task = {
    taskId: 1,
    title: 'Test Task',
    description: 'Test Description',
    deadline: new Date(),
    priority: 1,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskService = {
    findAll: jest.fn().mockResolvedValue([mockTask]),
    findOne: jest.fn().mockResolvedValue(mockTask),
    create: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest.fn().mockResolvedValue(mockTask),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskServiceController],
      providers: [
        {
          provide: TaskServiceService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskServiceController>(TaskServiceController);
    service = module.get<TaskServiceService>(TaskServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      await expect(controller.findAll()).resolves.toEqual([mockTask]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return one task', async () => {
      const dto: FindTaskDto = { id: 1 };
      await expect(controller.findOne(dto)).resolves.toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create and return a task', async () => {
      const dto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Desc',
        deadline: new Date().toISOString(),
        priority: 2,
      };
      await expect(controller.create(dto)).resolves.toEqual(mockTask);
      expect(service.create).toHaveBeenCalledWith({
        ...dto,
        deadline: expect.any(Date),
      });
    });
  });

  describe('update', () => {
    it('should update and return a task', async () => {
      const dto: UpdateTaskPayloadDto = {
        id: 1,
        data: { title: 'Updated Title', deadline: new Date().toISOString() },
      };
      await expect(controller.update(dto)).resolves.toEqual(mockTask);
      expect(service.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Updated Title', deadline: expect.any(Date) }),
      );
    });
  });

  describe('remove', () => {
    it('should remove and return a task', async () => {
      const dto: FindTaskDto = { id: 1 };
      await expect(controller.remove(dto)).resolves.toEqual(mockTask);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
