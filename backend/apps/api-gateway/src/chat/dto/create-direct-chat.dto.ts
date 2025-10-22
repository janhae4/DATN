import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectChatDto {
  @ApiProperty({
    description: 'ID của người dùng mà bạn muốn bắt đầu cuộc trò chuyện',
    example: 'clx4o5p6q0000c8v9a1b2c3d4',
  })
  @IsString()
  @IsNotEmpty()
  partnerId: string;
}
