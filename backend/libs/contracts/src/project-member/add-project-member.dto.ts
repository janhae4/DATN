import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddProjectMemberDto {
  @ApiProperty({
    description: 'ID of the project',
    example: 'a012bf8b-99f6-452a-ace7-ae8ab6818020',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'ID of the user to add to the project',
    example: '7714ffbf-908c-4ad4-b005-89b5440cb502',
  })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({
    description: 'Role of the member in the project',
    enum: ProjectRole,
    default: ProjectRole.MEMBER,
  })
  @IsEnum(ProjectRole)
  role?: ProjectRole;



}
