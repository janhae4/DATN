// Dựa trên 'types/label.interface.ts'
import {
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLabelDto {
  @ApiProperty({ example: 'Bug' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#EFE9E3' })
  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string = '#EFE9E3'; 

  @IsUUID()
  @ApiProperty({ example: '41349af4-756b-4d72-8b55-6ac4ddbf3d9e' })
  @IsNotEmpty()
  projectId: string;
}
