export class OAuthLoginDto {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  accessToken: string;
}
