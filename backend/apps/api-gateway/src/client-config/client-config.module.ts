import { Module } from '@nestjs/common';
import { ClientConfigService } from './client-config.service';
import { ConfigModule } from '@nestjs/config';
import * as joi from 'joi';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
      validationSchema: joi.object({
        USER_CLIENT_PORT: joi.number().default(3001),
        AUTH_CLIENT_PORT: joi.number().default(3002),
        REDIS_CLIENT_PORT: joi.number().default(6379),
      })
    })
  ],
  providers: [ClientConfigService],
  exports: [ClientConfigService]
})
export class ClientConfigModule {}
