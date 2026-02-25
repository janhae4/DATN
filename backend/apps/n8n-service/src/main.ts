import { NestFactory } from '@nestjs/core';
import { N8nServiceModule } from './n8n-service.module';

async function bootstrap() {
  const app = await NestFactory.create(N8nServiceModule);
  await app.listen(process.env.N8N_SERVICE_PORT ?? 3006);
}
bootstrap();
