export class VerifyTokenDto {
  userId: string;
  code: string;
  expiredCode: Date;
}
