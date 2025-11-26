import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { CreateListDto, UpdateListDto } from '@app/contracts';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { ListService } from './list.service';
import { CurrentUser } from '../common/role/current-user.decorator';
@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new list' })
  @ApiBody({ type: CreateListDto })
  create(@Body() createListDto: CreateListDto, @CurrentUser('id') id: string) {
    

    return this.listService.create(createListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a list by id' })
  findOne(@Param('id') id: string) {
    return this.listService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a list by id' })
  @ApiBody({ type: UpdateListDto })
  update(
    @Param('id') id: string, 
    @Body() updateListDto: UpdateListDto, 
  ) {
    return this.listService.update(id, updateListDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a list by id' })
  remove(@Param('id') id: string) {
    return this.listService.remove(id);
  }
}
