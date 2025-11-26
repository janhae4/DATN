import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { ProjectsModule } from './projects/projects.module';
import { Project } from '@app/contracts/project/entity/project.entity';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseProjectUrl,
        autoLoadEntities: true, 
        synchronize: true,
      }),
    }),
    ProjectsModule, 
  ],
})
export class ProjectServiceModule {}