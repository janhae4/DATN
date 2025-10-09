import { IsString, IsUUID } from "class-validator";

export class UpdatePasswordDto {
    @IsUUID()
    id: string;
    @IsString()
    password: string;
}