import { IsArray, IsString, ValidateNested } from 'class-validator';
import { MemberDto } from './member.dto';
import { Type } from 'class-transformer';

export class CreateTeamDto {
    @IsString()
    ownerId: string;

    @IsString()
    name: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MemberDto)
    members: MemberDto[];
}
