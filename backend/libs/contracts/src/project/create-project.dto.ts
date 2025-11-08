// Dựa trên 'types/project.type.ts'
import { IsArray, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[] = [];

  @IsString()
  @IsOptional()
  ownerId?: string;
}

