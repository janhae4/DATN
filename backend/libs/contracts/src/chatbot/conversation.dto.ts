// ./schema/conversation.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsArray, IsDateString } from 'class-validator';
import { MessageResponseDto } from './message-response.dto';

// DTO này đại diện cho MỘT cuộc hội thoại đầy đủ
export class ConversationResponseDto {
    @IsString()
    _id: string;

    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MessageResponseDto)
    messages: MessageResponseDto[];

    @IsDateString()
    createdAt: Date;

    @IsDateString()
    updatedAt: Date;
}