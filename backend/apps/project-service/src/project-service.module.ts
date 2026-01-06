import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { ProjectsModule } from './projects/projects.module';
import { Project } from '@app/contracts/project/entity/project.entity';

@Module({
  imports: [
    ClientConfigModule,
    ProjectsModule, 
  ],
})
export class ProjectServiceModule {}