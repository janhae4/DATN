import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsArray, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApprovalStatus } from '../enums/approval-status.enum';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsUUID('4', { each: true })
    labelIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsUUID('4', { each: true })
    assigneeIds?: string[];

    @IsOptional()
    @IsEnum(ApprovalStatus)
    approvalStatus?: ApprovalStatus;
}
