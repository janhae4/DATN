import { Test, TestingModule } from '@nestjs/testing';
import { SocketController } from './socket.controller';

describe('SocketController', () => {
  let socketController: SocketController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SocketController],
    }).compile();

    socketController = app.get<SocketController>(SocketController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
    });
  });
});
