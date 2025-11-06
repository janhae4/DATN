import { Injectable, OnModuleInit } from '@nestjs/common';
<<<<<<< HEAD
import { PrismaClient } from '@app/prisma';
=======
import { PrismaClient } from '../generated/prisma';
>>>>>>> frontend/feature/backlogs

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
