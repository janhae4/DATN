import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class UpdateProjectMemberDto {
  @ApiProperty({
    description: 'ID of the project',
    example: 'a012bf8b-99f6-452a-ace7-ae8ab6818020',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'ID of the user to update',
    example: '7714ffbf-908c-4ad4-b005-89b5440cb502',
  })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({
    description: 'New role for the project member',
    enum: ProjectRole,
  })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}
