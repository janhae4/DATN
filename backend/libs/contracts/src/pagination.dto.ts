import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RequestPaginationDto {
    @ApiProperty({
        description: 'Search query',
        required: false,
    })
    @IsString()
    @IsOptional()
    query?: string;

    @ApiProperty({
        description: 'Page number',
        required: false,
        default: 1,
    })
    @ApiProperty({
        description: 'Page number',
        required: false,
        default: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        required: false,
        default: 20,
        maximum: 100,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 1;
}


export class ResponsePaginationDto<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}