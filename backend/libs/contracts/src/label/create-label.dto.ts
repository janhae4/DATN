// Dựa trên 'types/label.interface.ts'
import {
  IsHexColor,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
