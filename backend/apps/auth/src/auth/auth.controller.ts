import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/contracts/auth/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @MessagePattern('auth.signup')
  // create(@Payload() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }

  @MessagePattern('auth.login')
  login(@Payload() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern('auth.validateToken')
  validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }

  // @MessagePattern('auth.getRefreshToken')
  // getRefreshToken(@Payload() id: number) {
  //   return this.authService.getRefreshToken(id);
  // }

  // @MessagePattern('auth.validate')
  // validate(@Payload() id: number) {
  //   return this.authService.validate(id);
  // }
}
