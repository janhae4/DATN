import { Provider } from '@app/contracts';

export class CreateAuthOAuthDto {
  provider: Provider;
  providerId?: string;
  email?: string;
  name?: string;
  avatar?: string;
}
