import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ListCategoryEnum } from '../enums/list-category.enum';

export class CreateListDto {
  @ApiProperty({
    description: 'The name of the list',
    example: 'To Do',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The order of the list in the workflow',
    example: 1.0,
  })
  @IsNumber()
  position: number;

  @ApiProperty({
    description: 'The color code of the list in hex format',
    example: '#FFFFFF',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'The ID of the project this list belongs to',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'The logical category of the list',
    enum: ListCategoryEnum,
    default: ListCategoryEnum.TODO,
    required: false,
  })
  @IsEnum(ListCategoryEnum)
  @IsOptional()
  category?: ListCategoryEnum;

  @ApiProperty({
    description: 'Whether the list is archived',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
