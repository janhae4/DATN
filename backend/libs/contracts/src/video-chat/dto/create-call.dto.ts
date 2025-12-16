import { IsArray, IsEmpty, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RefType } from '../enum';

export class CreateCallDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional({ each: true })
  participantIds: string[];

  @IsString()
  @IsNotEmpty()
  teamId: string

  @IsString()
  @IsOptional()
  userId?: string

  @IsEnum(RefType)
  @IsOptional()
  refType?: RefType

  @IsString()
  @IsOptional()
  refId?: string
}
