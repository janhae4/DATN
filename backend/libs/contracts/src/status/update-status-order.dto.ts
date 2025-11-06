import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class StatusOrderEntry {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsNotEmpty()
  order: number;
}

export class UpdateStatusOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatusOrderEntry)
  statuses: StatusOrderEntry[];
}
