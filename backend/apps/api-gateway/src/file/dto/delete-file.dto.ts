import { IsOptional, IsString } from "class-validator";

export class DeleteFiles {
    @IsString({ each: true })
    fileIds: string[]

    @IsOptional()
    @IsString()
    teamId?: string

    @IsOptional()
    @IsString()
    projectId?: string
}