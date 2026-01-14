import { forwardRef, Module } from '@nestjs/common';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';
import {
  ClientConfigModule,
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    ClientConfigModule,
  ],

  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule { }