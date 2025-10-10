export enum EmailSystemType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export class SendMailDto {
  userId: string;
  to?: string;
  subject: string;
  messageText: string;
  content?: string;
  type?: EmailSystemType;
}