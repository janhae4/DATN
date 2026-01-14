import { Module } from '@nestjs/common';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from '@app/contracts/list/list/list.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([List])
  ],
  controllers: [ListController],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule { }
