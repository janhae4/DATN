import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, Provider } from '@app/contracts';
import { AuthService } from '../auth/auth.service';

@Controller('admin/users')
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/skills')
  updateSkills(@Param('id') id: string, @Body('skills') skills: string[]) {
    return this.userService.updateSkills(id, skills);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete('accounts/:id')
  async removeAccount(@Param('id') id: string) {
    const result: any = await this.userService.removeAccount(id);
    
    if (result.userId && result.provider === Provider.GOOGLE) {
      await this.authService.clearGoogleToken(result.userId);
    }
    
    return result;
  }
}
