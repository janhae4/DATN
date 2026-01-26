import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiateUploadDto {
    @ApiProperty({
        example: 'my_report.pdf',
        description: 'The original name of the file',
    })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({
        example: 'application/pdf',
        description: 'The MIME type of the file',
    })
    @IsString()
    @IsNotEmpty()
    fileType: string;

    @IsUUID()
    @IsOptional()
    teamId?: string

    @IsUUID()
    @IsOptional()
    projectId?: string

    @IsUUID()
    @IsOptional()
    parentId: string | null = null;
}