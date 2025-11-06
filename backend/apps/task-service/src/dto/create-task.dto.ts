import { TaskStatus } from '../generated/prisma';

export class CreateTaskDto {
  title: string;
  description?: string;
  deadline?: string;
  priority?: number;
  status?: TaskStatus;
}
