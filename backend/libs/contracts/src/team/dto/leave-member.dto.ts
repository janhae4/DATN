import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LeaveMember{
    @IsString()
    @IsNotEmpty()
    requesterId: string

    @IsString()
    @IsOptional()
    requesterName?: string

    @IsString()
    @IsNotEmpty()
    teamId: string;

    @IsString()
    @IsOptional()
    teamName?: string

    @IsArray()
    @IsOptional()
    memberIds?: string[]
}