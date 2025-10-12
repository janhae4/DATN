import { User } from 'apps/user/src/user/entity/user.entity';

export class ResetCodeDto {
  user: User;
  code: string;
  expiredCode: Date;
}
