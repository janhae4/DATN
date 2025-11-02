import { IsString } from 'class-validator';

export class TransferOwnership {
  @IsString()
  teamId: string;

  @IsString()
  newOwnerId: string;

  @IsString()
  requesterId: string;
}

export interface TransferOwnershipEventPayload {
  teamId: string;
  teamName: string;
  newOwnerId: string;
  newOwnerName: string;
  requesterId: string;
  requesterName: string;
  memberIdsToNotify: string[]
}
