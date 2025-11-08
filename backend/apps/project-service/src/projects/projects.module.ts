import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SprintsModule } from '../sprints/sprints.module';
import { TasksModule } from '../tasks/tasks.module';
import { EpicsModule } from '../epics/epics.module';
import { LabelsModule } from '../labels/labels.module';
import { StatusModule } from '../status/status.module';
import { ProjectsService } from './projects.service';

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
