import { PartialType } from "@nestjs/mapped-types";
import { SendEmailDto } from "./send-email.dto";

export class sendEmailResetPasswordDto extends PartialType(SendEmailDto) {
    resetUrl: string
    code: string
}