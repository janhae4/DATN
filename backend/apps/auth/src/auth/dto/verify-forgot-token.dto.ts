export class VerifyForgotTokenDto {
    userId: string
    resetCode: string
    expiredCode: Date
}