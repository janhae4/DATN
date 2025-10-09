export class UpdateVideoChatDto {
  owner?: string;
  isPrivate?: boolean;
  password?: string;
  maxSize?: number;
  status?: 'active' | 'ended' | 'scheduled';
  description?: string;
  startedAt?: Date;
  endTime?: Date;
  duration?: number;
}
