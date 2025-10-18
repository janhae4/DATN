import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Team } from '@app/contracts';
ConfigModule.forRoot();
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_TEAM_URL,
  entities: [Team],
  synchronize: true,
};
