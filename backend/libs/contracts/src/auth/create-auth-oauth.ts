import { Provider } from '../user/user.dto';

export class CreateAuthOAuthDto {
  accessToken?: string;
  refreshToken?: string;
  provider: Provider;
  providerId?: string;
  email?: string;
  name?: string;
  avatar?: string;
}
