import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddProjectMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole = ProjectRole.MEMBER;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  teamIds?: string[] = [];
}
