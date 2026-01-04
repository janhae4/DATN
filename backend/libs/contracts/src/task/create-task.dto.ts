import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '../enums/priority.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Implement user authentication',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the task',
    example: 'Implement JWT based authentication with refresh tokens',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID of the project this task belongs to',
    format: 'uuid',
  })
  @IsUUID()
  projectId: string;


  @ApiProperty({
    description: 'ID of the parent this task belongs to',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  parentId: string;

  @ApiProperty({
    description: 'ID of the list (column) this task is in',
    format: 'uuid',
  })
  @IsUUID()
  listId: string;

  @ApiProperty({
    description: 'IDs of the label this task is in',
    format: 'uuid',
  })
  @IsUUID('all', { each: true })
  @IsOptional()
  labelIds: string[];

  @ApiPropertyOptional({
    description: 'ID of the user who reported the task',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  reporterId?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the task',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Due date in ISO 8601 format',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Start date in ISO 8601 format',
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'ID of the parent epic (if any)',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  epicId?: string;

  @ApiPropertyOptional({
    description: 'ID of the sprint this task is assigned to',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional({
    description:
      'The position of the task within its column, for ordering.',
    example: 65535.0,
  })
  @IsNumber()
  @IsOptional()
  position?: number;

  // The following fields are for relations and are handled separately
  // task_assignees, task_labels, attachments
}
