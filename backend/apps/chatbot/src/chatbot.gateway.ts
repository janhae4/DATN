import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { Inject } from '@nestjs/common';
import { AUTH_CLIENT, CHATBOT_CLIENT, RAG_CLIENT } from '@app/contracts/constants';
import { ClientProxy, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { catchError, firstValueFrom, map, takeWhile, throwError } from 'rxjs';
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { CHATBOT_PATTERN } from '../../../libs/contracts/src/chatbot/chatbot.pattern';
@WebSocketGateway({
  cors: {
    origin: `http://localhost:5000`,
    credentials: true
  }
})
export class ChatbotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    @Inject(RAG_CLIENT) private readonly ragClient: ClientProxy
  ) { }
  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const cookieString = client.handshake.headers.cookie;
    if (!cookieString) {
      console.log('Không tìm thấy cookie, ngắt kết nối.');
      client.disconnect();
      return;
    }

    try {
      const parsedCookies = cookie.parse(cookieString);
      const accessToken = parsedCookies.accessToken;
      console.log('Access Token từ cookie:', accessToken);

      const user = await firstValueFrom<JwtDto>(
        this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, accessToken)
      );

      if (!user) {
        console.log('Token không hợp lệ, ngắt kết nối.');
        client.disconnect();
        return;
      }

      console.log(`Xác thực thành công cho user: ${user.id}`);
      client.data.user = user;
      client.emit("authenticated", user);
    } catch (error) {
      console.error('Lỗi xác thực token:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(CHATBOT_PATTERN.ASK_QUESTION)
  handleAskQuestion(client: Socket, question: string): void {
    const user = client.data.user as JwtDto;
    if (!user) {
      console.log("Invalid user");
      return;
    }

    console.log(`Received ask_question from ${client.id}:`, question);

    const requestPayload = {
      userId: user.id,
      question,
      socketId: client.id
    };
    this.ragClient.emit(CHATBOT_PATTERN.ASK_QUESTION, requestPayload);
  }

  @SubscribeMessage(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT)
  handleSummarizeDocument(client: Socket, fileName: string): void {
    const user = client.data.user as JwtDto;
    if (!user) {
      console.log("Invalid user");
      return;
    }

    console.log(`Received summarize_document from ${client.id}:`, fileName);

    const requestPayload = {
      userId: user.id,
      fileName,
      socketId: client.id
    };
    
    this.ragClient.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, requestPayload);
  }



  handleStreamResponse(@Payload() response: { socketId: string, type: string, content: string }) {
    const client = this.server.sockets.sockets.get(response.socketId);
    console.log(`[EventPattern] Nhan response tu queue: ${JSON.stringify(response)}`);
    if (!client) {
      console.log(`[EventPattern] Client ${response.socketId} không còn kết nối, bỏ qua chunk.`);
      return;
    }

    console.log(`[EventPattern] Nhan chunk: ${response.content}`);

    if (response.type === 'chunk') {
      client.emit(CHATBOT_PATTERN.RESPONSE_CHUNK, response.content);
    } else if (response.type === 'error') {
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, response.content);
    } else if (response.type === 'end') {
      client.emit(CHATBOT_PATTERN.RESPONSE_END, response.content);
    }
  }
}
