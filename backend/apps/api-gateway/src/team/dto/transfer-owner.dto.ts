import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class TransferOwnership {
    @IsString()
    @ApiProperty({
        description: 'The unique identifier of the team to add members to.',
        example: '123123'
    })
    newOwnerId: string;
}