import { IsArray, IsString, IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UserOnboardingDto {
    @IsString()
    @IsNotEmpty()
    jobTitle: string;

    @ApiProperty({
        description: 'List of skills the user is interested in',
        example: ['React', 'NodeJS', 'TypeScript'],
        type: [String]
    })
    @IsArray()
    @IsString({ each: true })
    interests: string[];
}