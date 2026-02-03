import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';

export class CreateDiscussionMessageDto {

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Chào bạn, khoẻ không?',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    description: 'ID team',
    example: '',
  })
  @IsString()
  @IsOptional()
  teamId?: string

  @ApiProperty({
    description: 'Danh sách tệp đính kèm',
    required: false,
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  attachments?: any[];

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  discussionId?: string;
}
