import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateCallDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  participantIds: string[];
}