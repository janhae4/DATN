import { IsOptional, IsString } from "class-validator";

export class DownloadFiles {
    @IsOptional()
    @IsString()
    projectId?: string

    @IsOptional()
    @IsString()
    teamId?: string

    @IsString({ each: true })
    fileIds: string[]
}