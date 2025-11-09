// Dựa trên 'types/status.interaface.ts'
import {
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { StatusEnum } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
/**
 * Data Transfer Object for creating a new status
 */
export class CreateStatusDto {
  
  @ApiProperty({
    description: 'The name of the status',
    example: 'Backlog',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The color code of the status in hex format',
    example: '#FFA500',
    required: true
  })
  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    description: 'The order of the status in the list',
    example: 1,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  order: number;

  @ApiProperty({
    description: 'The type of status',
    enum: StatusEnum,
    example: StatusEnum.in_progress,
    required: true
  })
  @IsEnum(StatusEnum)
  @IsNotEmpty()
  status: StatusEnum;

  @ApiProperty({
    description: 'The ID of the project this status belongs to',
    example: '608aa21d-e730-4e02-b731-a20146cc6e38',
    required: false
  })
  @IsUUID()
  @IsOptional()
  projectId: string;

  @ApiProperty({
    description: 'The ID of the user who created this status',
    example: '19f14dbd-5eaf-4c71-873d-286215ce6ad7',
    required: true
  })
  @IsUUID()
  @IsOptional()
  userId: string;
}
