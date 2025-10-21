import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from "class-validator";

export class RemoveMember {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        name: 'teamId',
        description: 'The unique identifier of the team to add members to.',
        example: '123123'
    })
    teamId: string;

    @IsString({ each: true })
    @IsArray()
    @ArrayMinSize(1, {
        message: 'At least one memberId must be provided.'
    })
    @ApiProperty({
        name: 'memberIds',
        description: 'An array of unique identifiers of the members to add to the team.',
        example: ['123123', '456456']
    })
    memberIds: string[]
}