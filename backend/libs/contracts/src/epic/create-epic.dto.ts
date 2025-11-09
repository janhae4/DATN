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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEpicDto {
  @ApiProperty({
    example: 'User Authentication Epic',
    description: 'Tên của epic',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Implement user authentication flow including login, register, and password reset',
    description: 'Mô tả chi tiết về epic',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: EpicStatus,
    example: 'todo',
    description: 'Trạng thái của epic',
  })
  @IsEnum(EpicStatus)
  @IsOptional()
  status?: EpicStatus;

  @ApiPropertyOptional({
    enum: Priority,
    example: 'high',
    description: 'Độ ưu tiên của epic',
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({
    example: '608aa21d-e730-4e02-b731-a20146cc6e38',
    description: 'ID của dự án chứa epic này',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    example: '660e8400-e29b-41d4-a716-446655440000',
    description: 'ID của sprint chứa epic này (nếu có)',
  })
  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional({
    example: '2025-12-01T00:00:00.000Z',
    description: 'Ngày bắt đầu dự kiến của epic (ISO format)',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Hạn chót hoàn thành epic (ISO format)',
  })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];
}
