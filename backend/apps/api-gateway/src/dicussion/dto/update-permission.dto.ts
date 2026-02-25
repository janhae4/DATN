import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import {  MemberRole } from '@app/contracts';
import { PermissionKey } from '@app/contracts/enums/permission-key.enum';

export class PermissionOverrideDto {
    @ApiProperty({ description: 'ID của user cụ thể (nếu muốn set quyền cho cá nhân)', required: false })
    @IsString()
    @IsOptional()
    userId?: string;

    @ApiProperty({ description: 'Vai trò (nếu muốn set quyền cho cả nhóm)', enum: MemberRole, required: false })
    @IsEnum(MemberRole)
    @IsOptional()
    role?: MemberRole;

    @ApiProperty({ description: 'Danh sách các quyền được phép', enum: PermissionKey, isArray: true })
    @IsArray()
    @IsEnum(PermissionKey, { each: true })
    allow: PermissionKey[];

    @ApiProperty({ description: 'Danh sách các quyền bị cấm', enum: PermissionKey, isArray: true })
    @IsArray()
    @IsEnum(PermissionKey, { each: true })
    deny: PermissionKey[];
}

export class UpdatePermissionDto {
    @ApiProperty({ type: PermissionOverrideDto })
    override: PermissionOverrideDto;
}
