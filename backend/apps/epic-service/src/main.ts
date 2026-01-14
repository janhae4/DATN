import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';
import { EpicsModule } from './epics/epics.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
 const appContext = await NestFactory.create(EpicsModule);
  appContext.useGlobalInterceptors(new RpcResponseInterceptor());
  await appContext.init();
  Logger.log('Epic Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();