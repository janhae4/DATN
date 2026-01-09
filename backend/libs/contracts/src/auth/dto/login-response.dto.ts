export class LoginResponseDto {
  userId?: string;
  accessToken: string;
  refreshToken: string;
  isFirstLogin?: boolean;
}
