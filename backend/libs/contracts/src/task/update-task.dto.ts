import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsArray, IsString, IsUUID } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsUUID('4', { each: true })
    labelIds?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsUUID('4', { each: true })
    assigneeIds?: string[];
}
