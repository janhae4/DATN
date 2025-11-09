// Dựa trên 'types/task.type.ts'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Priority } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    description: 'Priority level of the task',
    enum: Priority,
    example: Priority.medium,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Due date in ISO 8601 format',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'ID of the status',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional() 
  statusId?: string;

  @ApiProperty({
    description: 'ID of the project this task belongs to',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    description: 'ID of the parent epic (if any)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  epicId?: string;

  @ApiPropertyOptional({
    description: 'ID of the sprint this task is assigned to',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional({
    description: 'Array of user IDs assigned to this task',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of label IDs associated with this task',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  labelIds?: string[];
}
