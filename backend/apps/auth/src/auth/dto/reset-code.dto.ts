import { User } from '@app/contracts/user/entity/user.entity';

export class ResetCodeDto {
  user: User;
  code: string;
  expiredCode: Date;
}
