import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @MessagePattern('auth.signup')
  // create(@Payload() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }

  @MessagePattern('auth.createAccessToken')
  createAccessToken(@Payload() payload: any) {
    console.log(payload);
    return this.authService.createAccessToken(payload);
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
