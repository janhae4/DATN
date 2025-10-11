import { PartialType } from "@nestjs/mapped-types";
import { SendEmailDto } from "./send-email.dto";

export class SendEmailVerificationDto extends PartialType(SendEmailDto) {
    verificationUrl: string
    code: string
}