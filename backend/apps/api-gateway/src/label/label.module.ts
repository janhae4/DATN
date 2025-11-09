import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { 
  ClientConfigModule, 
  ClientConfigService, 
  PROJECT_CLIENT, 
} from '@app/contracts';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';
@Module({
  imports: [
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: PROJECT_CLIENT,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (configService: ClientConfigService) => (
          configService.projectClientOptions
        )
      }
    ])
  ],
  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule {}