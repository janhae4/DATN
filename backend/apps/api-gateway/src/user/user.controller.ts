import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, Role, UpdateUserDto } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';
import { CurrentUser } from '../common/role/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('/search')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  findByName(
    @Query('query') key: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser('id') requesterId: string
  ) {
    return this.userService.findByName({ key, options: { limit, page }, requesterId });
  }

  @Post('/:id/follow')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  follow(
    @CurrentUser('id') requesterId: string,
    @Param('id') followingId: string
  ) {
    return this.userService.follow(requesterId, followingId);
  }

  @Delete('/:id/follow')
  @UseGuards(RoleGuard)
  @Roles(Role.USER)
  unfollow(
    @CurrentUser('id') requesterId: string,
    @Param('id') followingId: string
  ) {
    return this.userService.unfollow(requesterId, followingId);
  }

  @Post('/:id/ban')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  ban(@Param('id') id: string) {
    return this.userService.ban(id);
  }

  @Delete('/:id/ban')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  unban(@Param('id') id: string) {
    return this.userService.unban(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
