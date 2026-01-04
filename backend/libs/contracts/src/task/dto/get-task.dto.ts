import { Priority } from '@app/contracts/enums/priority.enum';

export class GetTasksFilterDto {
    projectId: string;
    search?: string;         
    assigneeIds?: string[];
    priority?: Priority[]; 
    statusId?: string[];     
    epicId?: string[];
    labelIds?: string[];    
    sprintId?: string[] | null;
    parentId?: string | null;
    page?: number;
    limit?: number;
}