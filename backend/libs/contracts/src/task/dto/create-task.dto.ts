import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @ApiProperty({
    name: 'text',
    type: String,
    description: 'Task text',
    example: 'Ngày mai nộp báo cáo vào lúc 5 giờ chiều',
    required: true,
  })
  @IsOptional()
  @IsString()
  listId?: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  position?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  @ApiProperty({
    name: 'text',
    type: String,
    description: 'Task text',
    example: 'Ngày mai nộp báo cáo vào lúc 5 giờ chiều',
    required: true,
  })
  text: string;
}
