import { MemberShip } from '@app/contracts/enums/membership.enum';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export const SENDER_SNAPSHOT_SYSTEM: SenderSnapshotDto = {
  _id: 'SYSTEM_ID',
  name: 'System',
  avatar: '',
  status: MemberShip.ACTIVE
}

class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  type: 'image' | 'file' | 'video';
}

export class SenderSnapshotDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(MemberShip)
  @IsNotEmpty()
  status: MemberShip.ACTIVE;
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  discussionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  teamId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];
}
