import { IsArray, IsEnum, IsString } from "class-validator";
import { MemberRole } from "@app/contracts";
export class VerifyPermissionPayload {
    @IsString()
    teamId: string;
    @IsString()
    userId: string;
    @IsArray()
    @IsEnum(MemberRole, { each: true })
    roles: MemberRole[]
}