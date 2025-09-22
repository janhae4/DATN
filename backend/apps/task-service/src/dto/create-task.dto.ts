import { TaskStatus } from '@app/prisma';

export class CreateTaskDto {
  title: string;
  description?: string;
  deadline?: string;
  priority?: number;
  status?: TaskStatus;
}
