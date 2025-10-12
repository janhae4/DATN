import { User } from 'apps/user/src/user/entity/user.entity';

export class SendEmailVerificationDto {
  user: User;
  url: string;
  code: string;
}
