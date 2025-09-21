import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Request } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../src/user/user.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
