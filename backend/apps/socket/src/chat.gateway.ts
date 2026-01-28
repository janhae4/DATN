import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtDto, AUTH_EXCHANGE, AUTH_PATTERN, MessageSnapshot, ResponseMessageDto, SendMessageEventPayload, AiDiscussionDto, CHATBOT_EXCHANGE, CHATBOT_PATTERN, ResponseStreamDto } from '@app/contracts';
import * as cookie from 'cookie';
import { RmqClientService } from '@app/common';
import { AuthenticatedSocket } from './socket.gateway';

@WebSocketGateway({
    namespace: 'chat',
    cors: {
        origin: [
            'http://localhost:5000',
            'http://localhost:3000',
            'http://frontend:5000',
        ],
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(private readonly amqpConnection: RmqClientService) { }

    async handleConnection(client: Socket) {
        try {
            const accessToken = cookie.parse(client.handshake.headers.cookie || '').accessToken;
            if (!accessToken) {
                client.disconnect();
                return;
            }

            const user = await this.amqpConnection.request<JwtDto>({
                exchange: AUTH_EXCHANGE,
                routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
                payload: accessToken,
            });

            if (!user) {
                client.disconnect();
                return;
            }

            (client as any).data.user = user;

            client.join(user.id);
            this.logger.log(`User ${user.id} connected to Chat Namespace`);
        } catch (error) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected from Chat Namespace: ${client.id}`);
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string }
    ) {
        client.join(payload.roomId);
        this.logger.log(`User ${(client as any).data.user?.id} joined text channel ${payload.roomId}`);
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string }
    ) {
        client.leave(payload.roomId);
    }

    @SubscribeMessage('typing_start')
    handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string }
    ) {
        const user = (client as any).data.user;
        client.to(payload.roomId).emit('typing_start', {
            userId: user.id,
            name: user.name,
            avatar: user.avatar
        });
    }

    @SubscribeMessage('typing_stop')
    handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string }
    ) {
        client.to(payload.roomId).emit('typing_stop', { userId: (client as any).data.user.id });
    }


    handleNewMessage(payload: SendMessageEventPayload) {
        const {
            discussionId,
            _id,
            messageSnapshot,
        } = payload;

        const senderId = messageSnapshot.sender?._id;
        if (!senderId) {
            this.logger.error("Lỗi: Tin nhắn không có senderId", payload);
            return;
        }

        const messageDoc: ResponseMessageDto = {
            _id,
            discussionId,
            message: messageSnapshot as MessageSnapshot,
        };

        this.logger.log(`Received new message for ${discussionId}. Sender: ${senderId}`);

        // SINGLE EFFICIENT BROADCAST TO ROOM
        this.server.to(discussionId).emit('new_message', messageDoc);
    }


    async handleStreamResponse(response: ResponseStreamDto) {
        const { discussionId, socketId, content, type, membersToNotify, teamId } = response;

        const client = this.server.sockets.sockets.get(socketId) as
            | AuthenticatedSocket
            | undefined;

        if (!client) {
            this.logger.warn(`Client ${socketId} not found.`);
            return;
        }

        if (!membersToNotify || membersToNotify.length === 0) {
            this.logger.warn(`Invalid 'membersToNotify' list for stream on ${socketId}.`);
            client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, { content: "Lỗi: Không tìm thấy người nhận stream (stream session error)." });
            return;
        }

        const emitToAll = (event: string, data: any) => {
            membersToNotify.forEach(userId => {
                this.server.to(userId).emit(event, {
                    ...data,
                    discussionId,
                    teamId
                });
            });
        };

        if (type === 'chunk') {
            const currentMessage = client.data.accumulatedMessage || '';
            client.data.accumulatedMessage = currentMessage + content;
            emitToAll(CHATBOT_PATTERN.RESPONSE_CHUNK, { content });
        } else if (type === 'start') {
            emitToAll(CHATBOT_PATTERN.RESPONSE_START, content);
        } else if (type === 'error') {
            emitToAll(CHATBOT_PATTERN.RESPONSE_ERROR, { content });
        } else if (type === "metadata") {
            try {
                client.data.streamMetadata = JSON.parse(content);
            } catch (e) {
                this.logger.warn(`Failed to parse metadata: ${content}`);
                client.data.streamMetadata = { error: "Invalid metadata received" };
            }
        } else if (type === 'end') {

            const fullMessage = client.data.accumulatedMessage || '';

            if (fullMessage.trim().length > 0) {
                const savedMessage = await this.amqpConnection.request<AiDiscussionDto>({
                    exchange: CHATBOT_EXCHANGE,
                    routingKey: CHATBOT_PATTERN.CREATE,
                    payload: {
                        discussionId,
                        message: fullMessage,
                        metadata: client.data.streamMetadata,
                    },
                });


                emitToAll(CHATBOT_PATTERN.RESPONSE_END, { id: savedMessage._id });

                this.logger.log(
                    `Saved streamed AI message for ${socketId} to discussion ${discussionId}.`,
                );
            }

            delete client.data.accumulatedMessage;
            delete client.data.streamMetadata;
        }
    }


    handleMessageUpdate(payload: {
        discussionId: string;
        messageId: string;
        content: string;
        membersToNotify: string[]
    }) {
        const { discussionId, messageId, content, membersToNotify } = payload;

        this.logger.log(`Broadcasting UPDATE for message ${messageId} in ${discussionId}`);

        membersToNotify.forEach((userId) => {
            this.server.to(userId).emit('message_update', {
                discussionId,
                messageId,
                content,
            });
        });
    }

    handleMessageDelete(payload: {
        discussionId: string;
        messageId: string;
        membersToNotify: string[]
    }) {
        const { discussionId, messageId, membersToNotify } = payload;

        this.logger.log(`Broadcasting DELETE for message ${messageId} in ${discussionId}`);

        membersToNotify.forEach((userId) => {
            this.server.to(userId).emit('message_delete', {
                discussionId,
                messageId,
            });
        });
    }

}