import { IsString } from 'class-validator';

export class CreateDirectDiscussionDto {
  @IsString()
  senderId: string;
  @IsString()
  partnerId: string;
}
