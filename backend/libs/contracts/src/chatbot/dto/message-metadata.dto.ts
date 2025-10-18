import { IsObject, IsOptional, IsString } from 'class-validator';

export class MessageMetadataDto {
  @IsObject()
  @IsOptional()
  retrieved_context?: Record<string, any>;

  @IsString()
  @IsOptional()
  error?: string;
}
