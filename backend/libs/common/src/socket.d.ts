import { JwtDto } from '@app/contracts';

declare module 'socket.io' {
  interface Socket {
    data: {
      user?: JwtDto;
    };
  }
}
