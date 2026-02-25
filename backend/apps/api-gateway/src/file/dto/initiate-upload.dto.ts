import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

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

    @IsString()
    @IsOptional()
    teamId?: string

    @IsString()
    @IsOptional()
    projectId?: string

    @IsString()
    @IsOptional()
    parentId: string | null = null;

    @IsOptional()
    @IsBoolean()
    isChatAttachment?: boolean;
}