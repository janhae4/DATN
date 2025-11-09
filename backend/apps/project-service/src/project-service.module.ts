import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';
import { StatusModule } from './status/status.module';
import { SprintsModule } from './sprints/sprints.module';
import { EpicsModule } from './epics/epics.module';
import { LabelsModule } from './labels/labels.module';
import { ClientConfigModule } from '@app/contracts';
import { ProjectsModule } from './projects/projects.module';
import { ProjectMemberModule } from './project-member/project-member.module';

@Module({
  imports: [
    ClientConfigModule, 
    ProjectsModule,
    TasksModule,
    StatusModule,
    SprintsModule,
    EpicsModule,
    LabelsModule,
    ProjectMemberModule,
  ],
  controllers: [],
  providers: [],
})
export class ProjectServiceModule {}