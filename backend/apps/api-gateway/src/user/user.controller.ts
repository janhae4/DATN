import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';
import { Roles } from '../role.decorator';
import { Role } from "@app/contracts/user/user.dto";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.Admin)
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @Roles(Role.User)
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }
}
