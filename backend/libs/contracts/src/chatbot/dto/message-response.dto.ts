import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { MessageMetadataDto } from './message.dto';

export class MessageResponseDto {
  @IsString()
  @IsIn(['user', 'ai', 'system'])
  role: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  timestamp: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetadataDto)
  metadata?: MessageMetadataDto;
}