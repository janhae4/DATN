import { IsOptional, IsString, IsUUID } from "class-validator";

export class UploadFilePayload {
    @IsString()
    fileName: string;
    @IsString()
    userId: string;
    @IsUUID()
    @IsOptional()
    projectId?: string;
    @IsUUID()
    @IsOptional()
    teamId?: string;
    @IsUUID()
    @IsOptional()
    parentId?: string | null = null;
}