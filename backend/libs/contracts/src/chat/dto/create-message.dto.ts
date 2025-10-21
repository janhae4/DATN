import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class AttachmentDto {
    @IsString()
    @IsNotEmpty()
    url: string;

    @IsString()
    @IsNotEmpty()
    type: 'image' | 'file' | 'video';
}

export class CreateChatMessageDto {
    @IsString()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    senderId: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttachmentDto)
    @IsOptional()
    attachments?: AttachmentDto[];
}