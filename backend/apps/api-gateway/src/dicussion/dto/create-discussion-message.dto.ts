import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';

export class CreateDiscussionMessageDto {

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Chào bạn, khoẻ không?',
    maxLength: 2000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

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

  @ApiProperty({
    description: 'ID của tin nhắn được trả lời',
    example: '6675b11a8b3a729e2e2a3b4d',
    required: false,
  })
  @IsOptional()
  @IsString()
  replyToId?: string;
}
