import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule],
  controllers: [RedisController],
  providers: [RedisService],
})
export class RedisModule {}
