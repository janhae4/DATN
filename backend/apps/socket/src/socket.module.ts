import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { ClientConfigModule} from '@app/contracts';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register()
  ],
  controllers: [SocketController],
  providers: [SocketGateway],
})
export class SocketModule { }