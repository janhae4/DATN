import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ProjectVisibility } from '../enums/project-visibility.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 'Project Alpha' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @ApiPropertyOptional({ example: 'This is a sample project for demonstration purposes.' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ example: '🚀' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: ProjectVisibility, example: ProjectVisibility.PRIVATE })
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

  @ApiPropertyOptional({ example: 'd4c3b2a1-6f5e-0987-dcba-0987654321fe' })
  @IsString()
  @IsOptional()
  ownerId?: string;
}