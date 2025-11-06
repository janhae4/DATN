// Dựa trên 'types/epic.type.ts'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EpicStatus, Priority } from '@prisma/client';

export class CreateEpicDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EpicStatus)
  @IsOptional()
  status?: EpicStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  // ownerId sẽ được service thêm vào

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];
}
