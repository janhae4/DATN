import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
<<<<<<<< HEAD:backend/apps/api-gateway/test/app.e2e-spec.ts
import { ApiGatewayModule } from './../src/api-gateway.module';

describe('ApiGatewayController (e2e)', () => {
========
import { VideoChatModule } from './../src/video-chat.module';

describe('VideoChatController (e2e)', () => {
>>>>>>>> frontend/feature/backlogs:backend/apps/video-chat/test/app.e2e-spec.ts
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
<<<<<<<< HEAD:backend/apps/api-gateway/test/app.e2e-spec.ts
      imports: [ApiGatewayModule],
========
      imports: [VideoChatModule],
>>>>>>>> frontend/feature/backlogs:backend/apps/video-chat/test/app.e2e-spec.ts
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
