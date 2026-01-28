import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServerDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Server name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Server avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class CreateChannelDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Channel name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Channel type', enum: ['TEXT', 'VOICE', 'CATEGORY'] })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Parent category ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: 'Owner ID', required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;
}

export class UpdateChannelDto {
  @ApiProperty({ description: 'Channel name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Channel type', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}

export class ReorderChannelsDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Channel orders', type: [Object] })
  @IsArray()
  orders: { id: string; position: number; parentId?: string }[];
}

export class AddMembersDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Requester ID' })
  @IsString()
  requesterId: string;

  @ApiProperty({ description: 'Requester name' })
  @IsString()
  requesterName: string;

  @ApiProperty({ description: 'Members to add', type: [Object] })
  @IsArray()
  members: { id: string; name: string }[];
}

export class RemoveMemberDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Member ID to remove' })
  @IsString()
  memberId: string;

  @ApiProperty({ description: 'Requester ID' })
  @IsString()
  requesterId: string;

  @ApiProperty({ description: 'Requester name' })
  @IsString()
  requesterName: string;
}

export class GenerateInviteDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Discussion ID' })
  @IsString()
  discussionId: string;

  @ApiProperty({ description: 'Creator ID', required: false })
  @IsOptional()
  @IsString()
  creatorId: string;

  @ApiProperty({ description: 'Maximum uses', required: false })
  @IsOptional()
  maxUses?: number;

  @ApiProperty({ description: 'Expires in days', required: false })
  @IsOptional()
  expiresInDays?: number;
}

export class JoinServerDto {
  @ApiProperty({ description: 'Invite code' })
  @IsString()
  code: string;
}

export class UpdateServerDto {
  @ApiProperty({ description: 'Server name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Server avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
