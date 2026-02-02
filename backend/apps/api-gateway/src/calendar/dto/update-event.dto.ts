import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
    @IsString()
    @IsOptional()
    destinationCalendarId?: string;
}