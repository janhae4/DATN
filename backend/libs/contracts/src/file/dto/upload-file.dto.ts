import { IsOptional, IsString } from "class-validator";

export class UploadFilePayload {
    @IsString()
    fileName: string;
    @IsString()
    userId: string;
    @IsString()
    @IsOptional()
    projectId?: string;
}