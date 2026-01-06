import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RenameFileDto {
    @ApiProperty({
        example: 'my_renamed_report.pdf',
        description: 'The new name for the file (metadata only)',
    })
    @IsString()
    @IsNotEmpty()
    newFileName: string;
}