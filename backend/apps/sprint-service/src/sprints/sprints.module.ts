import { Module } from '@nestjs/common';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from '@app/contracts/sprint/entity/sprint.entity';
import { ClientConfigModule, ClientConfigService, SPRINT_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';
@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint]),
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseSprintUrl,
        entities: [Sprint],
        synchronize: true,
      })
    }),
    RmqModule.register({
      exchanges: [
        {
          name: SPRINT_EXCHANGE,
          type: 'direct'
        }
      ]
    })
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule { }
