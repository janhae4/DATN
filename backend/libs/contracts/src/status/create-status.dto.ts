// Dựa trên 'types/status.interaface.ts'
import {
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { StatusEnum } from '@prisma/client';

export class CreateStatusDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @IsNumber()
  @IsNotEmpty()
  order: number;

  @IsEnum(StatusEnum)
  @IsNotEmpty()
  status: StatusEnum;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
