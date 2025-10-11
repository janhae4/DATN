export class VerifyTokenDto {
  userId: string;
  verifiedCode: string;
  expiredCode: Date;
}
