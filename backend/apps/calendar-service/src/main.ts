import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { CalendarModule } from './calendar-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(CalendarModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672'],
      queue: 'calendar_queue', // Gateway sẽ bắn vào queue này
      queueOptions: {
        durable: true,
      },
    },
  });
  await app.listen();
  console.log('📅 Calendar Service is running...');
}
bootstrap();