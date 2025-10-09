import { IsOptional, IsString, IsUUID } from "class-validator";

export class ResetPasswordDto {
    @IsOptional()
    @IsUUID()
    id?: string;
    @IsString()
    oldPassword: string;
    @IsString()
    newPassword: string;
}