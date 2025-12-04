import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { ClientConfigService } from '@app/contracts';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly cfg: ClientConfigService) {
    const connectionString = cfg.videoChatUrl;

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect();
  }
}
