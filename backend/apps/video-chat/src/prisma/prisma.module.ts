import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Đánh dấu là module toàn cục
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất service để các module khác có thể dùng
})
export class PrismaModule {}
