import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ClientConfigService } from '@app/contracts';
import { INestApplicationContext } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private cfg: ClientConfigService;

  constructor(private app: INestApplicationContext) {
    super(app);
    this.cfg = app.get(ClientConfigService);
  }
  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: `redis://${this.cfg.getRedisHost() || '127.0.0.1'}:${this.cfg.getRedisClientPort() || 6379}`
    });
    pubClient.on('error', err => console.error('Redis Pub Client Error', err));

    const subClient = pubClient.duplicate();
    subClient.on('error', err => console.error('Redis Sub Client Error', err));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    console.log('RedisIoAdapter');
    return server;
  }
}
