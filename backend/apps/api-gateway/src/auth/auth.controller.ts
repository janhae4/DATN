import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log(loginDto);
    return this.authService.login(loginDto, response);
  }

  @Post('/register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    return await this.authService.register(createAuthDto);
  }

  @Post('/refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.refresh(request, response);
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
}
