import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
<<<<<<< HEAD

@Module({
=======
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [ClientConfigModule],
>>>>>>> main
  controllers: [RedisController],
  providers: [RedisService],
})
export class RedisModule {}
