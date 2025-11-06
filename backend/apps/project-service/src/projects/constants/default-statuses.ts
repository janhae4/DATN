import { StatusEnum } from '@prisma/client';

export const defaultStatuses = [
  {
    name: 'To Do',
    status: StatusEnum.todo,
    color: '#808080',
    order: 1,
  },
  {
    name: 'In Progress',
    status: StatusEnum.in_progress,
    color: '#FFA500',
    order: 2,
  },
  {
    name: 'Done',
    status: StatusEnum.done,
    color: '#008000',
    order: 3,
      },
];
