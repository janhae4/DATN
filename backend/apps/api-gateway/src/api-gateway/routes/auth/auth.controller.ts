import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  Query,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { RoleGuard } from 'apps/api-gateway/src/common/role/role.guard';
import { Roles } from 'apps/api-gateway/src/common/role/role.decorator';
import { Role, UserDto } from '@app/contracts/user/user.dto';
import { GoogleAuthGuard } from 'apps/api-gateway/src/common/role/google-auth.guard';
import { GoogleAccountDto } from '@app/contracts/auth/account-google.dto';
import { VerifyAccountDto } from '@app/contracts/auth/verify-account.dto';
import { ForgotPasswordDto } from '@app/contracts/auth/forgot-password.dto';
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { ChangePasswordDto } from '@app/contracts/auth/reset-password.dto';
import { ConfirmResetPasswordDto } from '@app/contracts/auth/confirm-reset-password.dto';
import { catchError, throwError } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('hello')
  hello() {
    return { message: 'hello' };
  }

  @Get('/info')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  info(@Req() request: Request) {
    const user = request?.user as UserDto;
    return this.authService.getInfo(user.id);
  }

  @Post('/login')
  login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(loginDto, response);
  }

  @Post('/register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/verify/code')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  verifyLocal(@Req() request: Request, @Body() data: VerifyAccountDto) {
    const user = request.user as UserDto;
    return this.authService.verifyLocal(user.id, data.code);
  }

  @Get('/verify/token')
  verifyToken(@Query('token') token: string) {
    return this.authService.verifyToken(token);
  }

  @Post('/verify/reset')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  resetCode(@Req() request: Request) {
    const payload = request.user as JwtDto;
    return this.authService.resetVerificationCode(payload.id);
  }

  @Post('/changePassword')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const user = request?.user as UserDto;
    return this.authService.changePassword({ ...changePasswordDto, id: user.id });
  }

  @Post('/forgotPassword')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/forgotPassword/confirm/code')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  forgotPasswordConfirm(@Req() request: Request, @Body() data: ConfirmResetPasswordDto) {
    const payload = request.user as JwtDto;
    return this.authService.verifyForgetPasswordCode(payload.id, data.code ?? '', data.password ?? '');
  }

  @Post('/reset-password')
  forgotPasswordConfirmToken(@Body() data: ConfirmResetPasswordDto) {
    return this.authService.verifyForgetPasswordToken(data?.token ?? '', data?.password ?? '');
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

  @Get('/google/')
  @UseGuards(GoogleAuthGuard)
  googleLogin(@Query('type') type: 'link' | 'login') {
    void type;
  }

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() request: Request) {
    return this.authService.handleGoogleCallback(
      request.user as GoogleAccountDto,
    );
  }
}
