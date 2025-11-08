import { NestFactory } from '@nestjs/core';
import { ProjectServiceModule } from './project-service.module';
import { ClientConfigService } from '@app/contracts'; // Phải import config service

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ProjectServiceModule);
  
  const configService = app.get(ClientConfigService);

  const microservice = await NestFactory.createMicroservice(
    ProjectServiceModule,
    configService.projectClientOptions,
  );

  await microservice.listen();
  console.log('Project microservice is listening on port ' + configService.getProjectClientPort());
}
bootstrap();