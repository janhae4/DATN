import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Team } from '../../../../libs/contracts/src/team/team.entity';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_TEAM_URL,
  entities: [Team],
  synchronize: true,
};
