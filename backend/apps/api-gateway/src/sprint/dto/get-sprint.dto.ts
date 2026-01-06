import { SprintStatus } from "@app/contracts";
import { Transform } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";

export class FindAllSprintsDto {
    @IsString()
    projectId: string;

    @IsString()
    teamId: string;

    @IsOptional()
    @IsArray()
    @IsEnum(SprintStatus, { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    status?: SprintStatus[];
}