import { IsArray, IsEnum, IsString } from "class-validator";
import { MemberRole } from "./member.dto";

export class VerifyPermissionPayload {
    @IsString()
    teamId: string;
    @IsString()
    userId: string;
    @IsArray()
    @IsEnum(MemberRole, { each: true })
    roles: MemberRole[]
}