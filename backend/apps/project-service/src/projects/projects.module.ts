import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';

import { ProjectsService } from './projects.service';
import { PrismaModule } from 'apps/project-service/prisma/prisma.module';
import { EpicsModule } from '../epics/epics.module';
import { LabelsModule } from '../labels/labels.module';
import { SprintsModule } from '../sprints/sprints.module';
import { StatusModule } from '../status/status.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    SprintsModule,
    TasksModule,
    EpicsModule,
    LabelsModule,
    StatusModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
