import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddFilesToTaskDto {
  @ApiProperty({
    description: 'ID of the task to add files to',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({
    description: 'Array of file IDs to add to the task',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  fileIds: string[];
}
