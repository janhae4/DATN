import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from "class-validator";
import { MemberDto } from "./member.dto";

export class AddMember {
    @IsString()
    @IsNotEmpty()
    requesterId: string;

    @IsString()
    @IsNotEmpty()
    teamId: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'At least one memberId must be provided.' })
    @IsString({ each: true })
    memberIds: string[];
}

export interface AddMemberEventPayload {
    requesterId: string;
    requesterName: string;
    teamId: string;
    teamName: string;
    members: MemberDto[];
}