import { Module } from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberController } from './project-member.controller';
import { PrismaModule } from 'apps/project-service/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectMemberController],
  providers: [ProjectMemberService],
  exports: [ProjectMemberService],
})
export class ProjectMemberModule {}
