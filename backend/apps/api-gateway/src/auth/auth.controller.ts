import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ChangePasswordDto,
  ConfirmResetPasswordDto,
  CreateAuthDto,
  ForgotPasswordDto,
  GoogleAccountDto,
  JwtDto,
  LoginDto,
  Role,
  VerifyAccountDto,
} from '@app/contracts';
import { Roles } from '../common/role/role.decorator';
import { GoogleAuthGuard } from '../common/role/google-auth.guard';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/info')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  info(@CurrentUser('id') id: string) {
    console.log(id);
    return this.authService.getInfo(id);
  }

  @Post('/login')
  @ApiBody({ type: LoginDto })
  login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log(loginDto);
    return this.authService.login(loginDto, response);
  }

  @Post('/register')
  @ApiBody({ type: CreateAuthDto })
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/verify/code')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBody({ type: VerifyAccountDto })
  verifyLocal(@Req() request: Request, @Body() data: VerifyAccountDto) {
    const user = request.user as JwtDto;
    return this.authService.verifyLocal(user.id, data.code);
  }

  @Get('/verify/token')
  @ApiQuery({
    name: 'token',
    type: String,
    required: true,
    description: 'Verify token from email',
    example: 'eyJH...',
  })
  verifyToken(@Query('token') token: string) {
    return this.authService.verifyToken(token);
  }

  @Post('/verify/reset')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resend verification code',
    description: 'Resend verification code to email',
  })
  resetCode(@Req() request: Request) {
    const payload = request.user as JwtDto;
    return this.authService.resetVerificationCode(payload.id);
  }

  @Post('/changePassword')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const user = request?.user as JwtDto;
    return this.authService.changePassword({
      ...changePasswordDto,
      id: user.id,
    });
  }

  @Post('/forgotPassword')
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/forgotPassword/confirm/code')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiBody({ type: ConfirmResetPasswordDto })
  forgotPasswordConfirm(
    @Req() request: Request,
    @Body() data: ConfirmResetPasswordDto,
  ) {
    const payload = request.user as JwtDto;
    return this.authService.verifyForgetPasswordCode(
      payload.id,
      data.code ?? '',
      data.password ?? '',
    );
  }

  @Post('/reset-password')
  @ApiBody({ type: ConfirmResetPasswordDto })
  forgotPasswordConfirmToken(@Body() data: ConfirmResetPasswordDto) {
    return this.authService.verifyForgetPasswordToken(
      data?.token ?? '',
      data?.password ?? '',
    );
  }

  @Post('/refresh')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh token',
  })
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  @Post('/logout')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout',
  })
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }

  @Post('/logoutAll')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout all',
    description: 'Logout all',
  })
  logoutAll(
    @Req() request: Request,
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
  @ApiQuery({
    name: 'type',
    type: String,
    required: true,
    description: 'login or link',
    example: 'login',
  })
  googleLogin(@Query('type') type: 'link' | 'login') {
    void type;
  }

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google callback',
    description: 'Google callback',
  })
  googleCallback(@Req() request: Request) {
    return this.authService.handleGoogleCallback(
      request.user as GoogleAccountDto,
    );
  }
}
