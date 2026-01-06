// api-gateway/src/calendar/dto/get-event.dto.ts
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetEventDto {
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  calendarId?: string;
}