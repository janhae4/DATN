import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
export enum Provider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
}


export class AccountDto {
    @IsUUID()
    id: string;

    @IsEnum(Provider)
    provider: Provider;

    @IsString()
    providerId: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    accessToken?: string;

    @IsOptional()
    @IsString()
    refreshToken?: string;

    @IsUUID()
    userId: string;

    createdAt: Date;
    updatedAt: Date;
}
