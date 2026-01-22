import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import * as cookie from 'cookie';
import { firstValueFrom } from 'rxjs';
import { AUTH_CLIENT, JwtDto, AUTH_PATTERN } from '@app/contracts';
import { ClientProxy } from '@nestjs/microservices';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: JwtDto;
  };
}

export abstract class AuthenticatedGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  protected readonly logger: Logger;

  constructor(
    @Inject(AUTH_CLIENT)
    protected readonly authClient: ClientProxy,
    loggerName: string,
  ) {
    this.logger = new Logger(loggerName);
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    const cookieString = client.handshake.headers.cookie;
    if (!cookieString) {
      this.logger.warn(`Client ${client.id} - Disconnected, cookie not found.`);
      client.disconnect();
      return;
    }

    try {
      const parsedCookies = cookie.parse(cookieString);
      const accessToken = parsedCookies.accessToken;
      if (!accessToken) {
        throw new Error('Access token not found in cookies.');
      }
      this.logger.log(`Client ${client.id} - Access token found!`);

      const user = await firstValueFrom<JwtDto>(
        this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, accessToken),
      );

      if (!user) {
        this.logger.warn(`Client ${client.id} - Disconnected, invalid token.`);
        client.disconnect();
        return;
      }

      this.logger.log(`Client ${client.id} - Authenticated: ${user.id}`);
      client.data.user = user;

      this.onClientAuthenticated(client, user);
    } catch (error) {
      const e = error as Error;
      this.logger.error(
        `Client ${client.id} - Failed to validate token: ${e.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user as JwtDto;
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (User: N/A)`);
    }
  }

  protected abstract onClientAuthenticated(
    client: AuthenticatedSocket,
    user: JwtDto,
  ): void;
}
