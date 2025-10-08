import { Provider } from '../user/user.dto';

export class CreateAuthOAuthDto {
  provider: Provider;
  providerId?: string;
  email?: string;
  name?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
}
