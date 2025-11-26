import { IsArray, IsNotEmpty, IsOptional, IsString, Length, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectVisibility } from '../enums/project-visibility.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 'Project Alpha' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @ApiPropertyOptional({ example: 'ALPHA' })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  key?: string;

  @ApiPropertyOptional({ example: 'This is a sample project for demonstration purposes.' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ example: '🚀' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: ProjectVisibility, example: ProjectVisibility.TEAM })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ApiProperty({ example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiPropertyOptional({ example: 'https://example.com/background.jpg' })
  @IsString()
  @IsOptional()
  backgroundImageUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ example: ['11111111-2222-3333-4444-555555555555', '66666666-7777-8888-9999-000000000000'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];

  @ApiPropertyOptional({ example: '11111111-2222-3333-4444-555555555555' })
  @IsString()
  @IsOptional()
  ownerId?: string;
}