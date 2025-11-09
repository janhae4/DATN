import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { CreateLabelDto, UpdateLabelDto } from '@app/contracts';
import { LabelService } from './label.service';
import { ApiBody, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('label')
export class LabelController {
  constructor(private readonly labelService: LabelService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new label' })
  @ApiBody({ type: CreateLabelDto })
  create(@Body() createLabelDto: CreateLabelDto) {
    console.log('createLabelDto in Controller', createLabelDto);
    return this.labelService.create(createLabelDto);
  }

  @Get(':id')
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a label by id' })
  findOne(@Param('id') id: string) {
    return this.labelService.findOne(id);
  }

  @Patch(':id')
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a label by id' })
  @ApiBody({ type: UpdateLabelDto })
  update(
    @Param('id') id: string, 
    @Body() updateLabelDto: UpdateLabelDto, 
  ) {
    return this.labelService.update(id, updateLabelDto);
  }

  @Delete(':id')
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a label by id' })
  remove(@Param('id') id: string) {
    return this.labelService.remove(id);
  }
}
