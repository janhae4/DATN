// Dựa trên 'types/sprint.type.ts'
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';


import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;


}
