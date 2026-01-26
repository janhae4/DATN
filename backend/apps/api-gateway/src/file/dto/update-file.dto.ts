import { FileVisibility } from "@app/contracts"
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"

class UpdateFile {
    @IsUUID()
    @IsOptional()
    projectId?: string

    @IsUUID()
    @IsOptional()
    teamId?: string
}

export class MoveFile extends UpdateFile {
    @IsUUID()
    @IsOptional()
    fileId: string

    @IsUUID()
    @IsNotEmpty()
    parentId: string
}

export class UpdateFiles extends UpdateFile {
    @IsUUID('4', { each: true })
    fileIds: string[]
}

export class MoveFiles extends UpdateFiles {
    @IsUUID()
    parentId: string
}

export class BulkVisibility extends UpdateFiles {
    @IsNotEmpty()
    visibility: FileVisibility

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    allowedUserIds?: string[]
}