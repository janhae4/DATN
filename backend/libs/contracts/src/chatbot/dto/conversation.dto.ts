import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsDateString,
} from 'class-validator';
import { MessageResponseDto } from './message-response.dto';

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
