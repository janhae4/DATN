import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ClientConfigModule],
      useFactory: (configService: ClientConfigService) => ({
        secret: configService.getJWTSecret(),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ClientConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class SharedJwtModule {}
