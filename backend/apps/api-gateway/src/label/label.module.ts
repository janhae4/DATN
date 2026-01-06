import { Module } from '@nestjs/common';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';
import {
  ClientConfigModule,
  ClientConfigService,
  LABEL_EXCHANGE,
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
// THÊM ClientProvider để khai báo kiểu dữ liệu trả về
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    AuthModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: LABEL_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.labelClientOptions,
      },
    ]),
  ],

  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule {}