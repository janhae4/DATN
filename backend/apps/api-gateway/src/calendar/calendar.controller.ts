// api-gateway/src/calendar/calendar.controller.ts

import { Controller, Get, Post, Delete, Body, Param, UseGuards, Put, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Role } from '@app/contracts';
import { Roles } from '../common/role/role.decorator';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventDto } from './dto/get-event.dto';

@Controller('calendar')
@UseGuards(RoleGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) { }

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  getEvents(
    @CurrentUser() user: any,
    @Query() filter: GetEventDto
  ) {
    return this.calendarService.listEvents(user.id, filter);
  }
  
  @Get('list')
  @Roles(Role.ADMIN, Role.USER)
  getCalendars(@CurrentUser() user: any) {
    return this.calendarService.listCalendars(user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.USER)
  getEvent(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.calendarService.getEvent(user.id, eventId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  createEvent(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.calendarService.createEvent(user.id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.USER)
  deleteEvent(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.calendarService.deleteEvent(user.id, eventId);
  }


  @Put(':id')
  @Roles(Role.ADMIN, Role.USER)
  updateEvent(
    @CurrentUser() user: any,
    @Param('id') eventId: string,
    @Body() dto: UpdateEventDto
  ) {
    return this.calendarService.updateEvent(user.id, eventId, dto);
  }


}