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
import { Priority } from '@prisma/client'; // Import từ Prisma client đã generate

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsUUID()
  @IsOptional() // Status có thể là null
  statusId?: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsOptional()
  epicId?: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  labelIds?: string[]; // Dùng để connect labels
}
