import { Role } from '@app/contracts/user/user.dto';

export class UserValidateDto {
  id: string;
  role: Role;
}
