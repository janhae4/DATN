import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { CreateStatusDto, UpdateStatusDto } from '@app/contracts';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { CurrentUser } from '../common/role/current-user.decorator';
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new status' })
  @ApiBody({ type: CreateStatusDto })
  create(@Body() createStatusDto: CreateStatusDto, @CurrentUser('id') id: string) {
    
    if (!createStatusDto.userId) {
      createStatusDto.userId = id;
    }
    return this.statusService.create(createStatusDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a status by id' })
  findOne(@Param('id') id: string) {
    return this.statusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a status by id' })
  @ApiBody({ type: UpdateStatusDto })
  update(
    @Param('id') id: string, 
    @Body() updateStatusDto: UpdateStatusDto, 
  ) {
    return this.statusService.update(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a status by id' })
  remove(@Param('id') id: string) {
    return this.statusService.remove(id);
  }
}
