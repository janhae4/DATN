import { IsOptional, IsUUID } from "class-validator";

export class DeleteFiles {
    @IsUUID('4', { each: true })
    fileIds: string[]

    @IsOptional()
    @IsUUID()
    teamId?: string

    @IsOptional()
    @IsUUID()
    projectId?: string
}