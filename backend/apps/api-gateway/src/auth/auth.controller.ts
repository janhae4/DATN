import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  Query,
  Patch,
  Delete,
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
  constructor(private readonly authService: AuthService) { }

  @Post('/account')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({ type: CreateAuthDto })
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }


  @Get('/me')
  @UseGuards(RoleGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get current user info' })
  getMyInfo(@CurrentUser('id') id: string) {
    console.log(id);
    return this.authService.getInfo(id);
  }

  @Patch('/account/password')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (when logged in)' })
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.changePassword({
      ...changePasswordDto,
      id: userId,
    });
  }

  @Post('/session')
  @ApiOperation({ summary: 'Login (Create a new session)' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log(loginDto);
    return await this.authService.login(loginDto, response);
  }

  @Post('/session/refresh')
  @UseGuards(RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  @Delete('/session')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (Delete current session)' })
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }

  @Delete('/sessions')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all (Delete all sessions)' })
  logoutAll(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logoutAll(request, response);
  }


  @Post('/account/verification-code')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify account using a code (when logged in)' })
  @ApiBody({ type: VerifyAccountDto })
  verifyLocal(
    @CurrentUser('id') userId: string,
    @Body() data: VerifyAccountDto,
  ) {
    return this.authService.verifyLocal(userId, data.code);
  }
  @Post('/account/verification-code/resend')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend verification code (when logged in)' })
  resetCode(@CurrentUser('id') userId: string) {
    return this.authService.resetVerificationCode(userId);
  }

  @Get('/verify-email')
  @ApiOperation({ summary: 'Verify account using email token' })
  @ApiQuery({ name: 'token', type: String, required: true })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('/password-reset/request')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/password-reset/confirm')
  @ApiOperation({ summary: 'Confirm new password using token' })
  @ApiBody({ type: ConfirmResetPasswordDto })
  forgotPasswordConfirmToken(@Body() data: ConfirmResetPasswordDto) {
    return this.authService.verifyForgetPasswordToken(
      data?.token ?? '',
      data?.password ?? '',
    );
  }

  @Get('/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiQuery({ name: 'type', type: String, required: true, example: 'login' })
  googleLogin(@Query('type') type: 'link' | 'login') {
    void type;
  }


  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() request: Request, @Res() res: Response) {
    await this.authService.handleGoogleCallback(request.user as GoogleAccountDto, res);
  }

}
