import { IsString } from 'class-validator';

export class CreateDirectChatDto {
  @IsString()
  senderId: string;
  @IsString()
  partnerId: string;
}
