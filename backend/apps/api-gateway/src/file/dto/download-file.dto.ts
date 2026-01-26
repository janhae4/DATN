import { IsOptional, IsUUID } from "class-validator";

export class DownloadFiles {
    @IsOptional()
    @IsUUID()
    projectId?: string

    @IsOptional()
    @IsUUID()
    teamId?: string

    @IsUUID('all', { each: true })
    fileIds: string[]
}