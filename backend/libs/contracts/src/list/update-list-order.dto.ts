import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ListOrderEntry {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsNotEmpty()
  order: number;
}

export class UpdateListOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListOrderEntry)
  lists: ListOrderEntry[];
}