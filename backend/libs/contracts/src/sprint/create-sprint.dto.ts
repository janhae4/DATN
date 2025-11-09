import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @ApiProperty({
    example: 'Sprint 3 - Feature Dashboard',
    description: 'Tên sprint',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Implement the new analytics dashboard',
    description: 'Mục tiêu chính của sprint',
  })
  @IsString()
  @IsOptional()
  goal?: string;

  @ApiProperty({
    example: '2025-11-10T00:00:00.000Z',
    description: 'Ngày bắt đầu sprint (ISO format)',
  })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({
    example: '2025-11-25T23:59:59.000Z',
    description: 'Ngày kết thúc sprint (ISO format)',
  })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @ApiProperty({
    example: '608aa21d-e730-4e02-b731-a20146cc6e38',
    description: 'ID của project chứa sprint này',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    enum: SprintStatus,
    example: 'IN_PROGRESS',
    description: 'Trạng thái của sprint',
  })
  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;

  @ApiPropertyOptional({
    example: '19f14dbd-5eaf-4c71-873d-286215ce6ad7',
    description: 'ID của người tạo sprint',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
