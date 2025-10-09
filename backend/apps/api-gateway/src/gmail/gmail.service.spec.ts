import { Test, TestingModule } from '@nestjs/testing';
import { GmailService } from 'apps/gmail/src/gmail/gmail.service';

describe('GmailService', () => {
  let service: GmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GmailService],
    }).compile();

    service = module.get<GmailService>(GmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
