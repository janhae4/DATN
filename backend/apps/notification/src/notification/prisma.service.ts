import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
