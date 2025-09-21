import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(loginDto, response);
  }

  @Post('/register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return await this.authService.refresh(request, response);
  }

  @Post('/logout')
  async logout(@Res() request: Request) {
    return this.authService.logout(request);
  }

  @Post('/logoutAll')
  async logoutAll(@Res() request: Request) {
    return this.authService.logoutAll(request);
  }

  @Post('/findAllUser')
  async findAllUser() {
    return this.authService.findAllUser();
  }
}
