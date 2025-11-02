import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitiateUpdateDto {
    @ApiProperty({
        example: 'my_report_v2.pdf',
        description: 'The new name for the file being uploaded',
    })
    @IsString()
    @IsNotEmpty()
    newFileName: string;
}