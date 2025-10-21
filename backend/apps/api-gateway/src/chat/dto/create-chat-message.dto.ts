import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChatMessageDto {
    @ApiProperty({
        description: 'Nội dung tin nhắn',
        example: 'Chào bạn, khoẻ không?',
        maxLength: 2000,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;
}
