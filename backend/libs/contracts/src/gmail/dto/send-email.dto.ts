import { User } from '@app/contracts/user/entity/user.entity';

export class SendEmailVerificationDto {
  user: User;
  url: string;
  code: string;
}
