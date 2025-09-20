import { TaskStatus } from '../../../../generated/prisma';

export class UpdateTaskDto {
  title?: string;
  description?: string;
  deadline?: string;
  priority?: number;
  status?: TaskStatus;
}
