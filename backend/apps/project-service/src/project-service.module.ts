import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module'; // <--- Import module con
import { TasksModule } from './tasks/tasks.module';
import { StatusModule } from './status/status.module';
import { SprintsModule } from './sprints/sprints.module';
import { EpicsModule } from './epics/epics.module';
import { LabelsModule } from './labels/labels.module';
import { ClientConfigModule } from '@app/contracts';

@Module({
  imports: [
    ClientConfigModule, // Nạp config chung
    ProjectsModule, // Nạp module xử lý Project CRUD
    TasksModule, // Nạp module xử lý Task
    StatusModule,
    SprintsModule,
    EpicsModule,
    LabelsModule,
  ],
  controllers: [],
  providers: [],
})
export class ProjectServiceModule {}