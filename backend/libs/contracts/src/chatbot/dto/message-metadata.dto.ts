import { IsObject, IsOptional, IsString } from 'class-validator';

export class AttachedFileDto {
  @IsString()
  fileId: string;

  @IsString()
  name: string;
}

export class MessageMetadataDto {
  @IsObject()
  @IsOptional()
  retrieved_context?: Record<string, any>;

  @IsString()
  @IsOptional()
  error?: string;

  @IsOptional()
  files?: AttachedFileDto[];
}
