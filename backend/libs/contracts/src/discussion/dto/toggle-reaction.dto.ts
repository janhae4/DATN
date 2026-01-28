import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}