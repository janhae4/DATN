// libs/contracts/src/epic/create-epic.dto.ts
import {
  IsDateString,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '../enums/priority.enum';
import { EpicStatus } from '../enums/epic-status.enum';

export class CreateEpicDto {
  @ApiProperty({
    example: 'User Authentication Epic',
    description: 'Tên của epic',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Implement user authentication flow...',
    description: 'Mô tả chi tiết về epic',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '#FF5733',
    description: 'Màu đại diện (Mã Hex)',
  })
  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    enum: EpicStatus,
    example: EpicStatus.TODO,
    description: 'Trạng thái của epic',
  })
  @IsEnum(EpicStatus)
  @IsOptional()
  status?: EpicStatus;

  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.MEDIUM,
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
    example: '2025-12-01T00:00:00.000Z',
    description: 'Ngày bắt đầu dự kiến (ISO format)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Hạn chót hoàn thành (ISO format)',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  // Đã XÓA: sprintId (Entity không có cột này)
  // Đã XÓA: memberIds (Entity không có relation trực tiếp này)
}