import { IsBoolean, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Priority } from '@app/contracts/enums/priority.enum';

const toArray = ({ value }: any) => {
    if (value === 'null') return null;
    if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim());
    }
    return value;
};

export class BaseTaskFilterDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID('4', { each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') return value.split(',');
        return value;
    })
    assigneeIds?: string[];

    @IsOptional()
    @IsEnum(Priority, { each: true })
    @Transform(toArray)
    priority?: Priority[];

    @IsOptional()
    @IsUUID('4', { each: true })
    @Transform(toArray)
    statusId?: string[];

    @IsOptional()
    @IsUUID('4', { each: true })
    @Transform(toArray)
    epicId?: string[];

    @IsOptional()
    @IsUUID('4', { each: true })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    labelIds?: string[];

    @IsOptional()
    @IsUUID('4', { each: true })
    @Transform(toArray)
    @ValidateIf(o => o.sprintId !== 'null')
    sprintId?: string[] | null;

    @IsOptional()
    @Transform(({ value }) => value === 'null' ? null : value)
    @ValidateIf(o => o.parentId !== 'null')
    @IsUUID()
    parentId?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isCompleted?: boolean;

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'ASC';

    @IsOptional()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') return [value];
        return value;
    })
    sortBy?: string[];

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsUUID()
    @IsNotEmpty()
    teamId: string;

    @IsUUID()
    @IsNotEmpty()
    projectId: string;
}