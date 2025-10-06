import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskServiceService } from './task-service.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskPayloadDto } from './dto/update-task-payload.dto';
import { FindTaskDto } from './dto/find-task.dto';
import { TASK_PATTERNS } from '@app/contracts/task/task.patterns';
import { Task } from './generated/prisma';
import { GoogleCalendarService } from './google-calendar.service';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService,
    private readonly googleCalendarService: GoogleCalendarService
  ) { }

  // @MessagePattern(TASK_PATTERNS.FIND_ALL)
  // async findAll(): Promise<Task[]> {
  //   return this.taskServiceService.findAll();
  // }

  // @MessagePattern(TASK_PATTERNS.FIND_ONE)
  // async findOne(@Payload() data: FindTaskDto): Promise<Task> {
  //   return this.taskServiceService.findOne(data.id);
  // }

  // @MessagePattern(TASK_PATTERNS.CREATE)
  // async create(@Payload() createTaskDto: CreateTaskDto): Promise<Task> {
  //   const data = {
  //     ...createTaskDto,
  //     deadline: createTaskDto.deadline
  //       ? new Date(createTaskDto.deadline)
  //       : undefined,
  //   };
  //   return this.taskServiceService.create(data);
  // }

  // @MessagePattern(TASK_PATTERNS.UPDATE)
  // async update(@Payload() payload: UpdateTaskPayloadDto): Promise<Task> {
  //   // const { id, data: updateData } = payload;
  //   // const processedData = {
  //   //   ...updateData,
  //   //   deadline: updateData.deadline ?? undefined,
  //   // };
  //   // return this.taskServiceService.update(id, processedData);
  // }

  // @MessagePattern(TASK_PATTERNS.REMOVE)
  // async remove(@Payload() data: FindTaskDto): Promise<Task> {
  //   // return this.taskServiceService.remove(data.id);
  // }

  @MessagePattern(TASK_PATTERNS.FIND_GOOGLE_EVENTS)
  async findGoogleEvents() {
    const accessToken = 'ya29.a0AQQ_BDS7bWevmO6hCH9eKY97I5AbIWSONf5ansqyBUhvWCGYWR6stlCM8HzH1ywa9JTvRm-IRZikMFqgLL1TSUjEGFAA0MYJZp9i-PXiNJr8rRuWbFJDCw83M6GDmDRQbH_rwvbq8q6tfraTtxk-C34RzEJV0xD84fmQQpZEYfZTHc-YBf5AnDhIF0-kNdUkxfYvL8QaCgYKASQSARUSFQHGX2MiqTyK97BJcjp4RUN1oEYeSg0206',
    const refreshToken = '1//0ePmcOC0TcWOICgYIARAAGA4SNwF-L9Ir44z6euftEugUbCIO0olyRBPOFxnSTxNgv7Ar51DFRuCMs73BNaJwCVt208p0mA7y3Fg'
    return this.googleCalendarService.createEvent(accessToken, refreshToken);
  }
}
