import { Priority } from '@app/contracts/enums/priority.enum';

export class BaseTaskFilterDto {
    search?: string;
    assigneeIds?: string[];
    priority?: Priority[];
    statusId?: string[];
    epicId?: string[];
    labelIds?: string[];
    sprintId?: string[] | null;
    parentId?: string | null;
    isCompleted?: boolean;
    sortBy?: string[];
    sortOrder: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
    projectId: string;
    teamId: string;
}
