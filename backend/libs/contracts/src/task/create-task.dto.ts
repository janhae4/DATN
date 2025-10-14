import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
  text: string;
}
