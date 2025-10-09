import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordDto } from '@app/contracts/auth/reset-password.dto';
import { RoleGuard } from 'apps/api-gateway/src/common/role/role.guard';
import { Roles } from 'apps/api-gateway/src/common/role/role.decorator';
import { Role, UserDto } from '@app/contracts/user/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/info')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  async info(@Req() request: Request) {
    const user = request?.user as UserDto;
    return await this.authService.getInfo(user.id);
  }

  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.login(loginDto, response);
  }

  @Post('/register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/resetPassword')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() request: Request) {
    const user = request?.user as UserDto;
    return this.authService.resetPassword({...resetPasswordDto, id: user.id});
  }

  @Post('/refresh')
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  @Post('/logout')
  logout(
    @Res() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }

  @Post('/logoutAll')
  logoutAll(
    @Res() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logoutAll(request, response);
  }

  @Post('/findAllUser')
  findAllUser() {
    return this.authService.findAllUser();
  }

  @Get('/google/login')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() request: Request) {
    return this.authService.handleGoogleCallback(request);
  }
}
