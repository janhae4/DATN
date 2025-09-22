import { TaskStatus } from '@app/prisma';

export class UpdateTaskDto {
  title?: string;
  description?: string;
  deadline?: string;
  priority?: number;
  status?: TaskStatus;
}
