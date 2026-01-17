import { MemberRole } from '@app/contracts/enums/member-role.enum';
import { MemberStatus } from '../entity/team-member.entity';

export class MemberDto {
  id: string;
  teamId: string;
  role: MemberRole;
  isActive: boolean;
  status: MemberStatus;
  joinedAt?: Date;
  deletedAt?: Date | null;
  name: string;
  email: string;
  avatar: string;
}
