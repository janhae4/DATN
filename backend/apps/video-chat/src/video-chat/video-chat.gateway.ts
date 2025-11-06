import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép tất cả các origin, bạn có thể thay đổi thành địa chỉ frontend cụ thể
    methods: ['GET', 'POST'],
  },
})
export class VideoChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Dùng để theo dõi user trong các phòng
  private rooms: Record<string, string[]> = {};

  handleConnection(client: Socket) {
    console.log(`✅ NEW CLIENT CONNECTED:`);
    console.log(`   User ID: ${client.id}`);
    console.log(`   Time: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`   ─────────────────────────────────────`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ CLIENT DISCONNECTED:`);
    console.log(`   User ID: ${client.id}`);
    console.log(`   Time: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`   ─────────────────────────────────────`);

    // Tìm và xóa user khỏi phòng khi họ ngắt kết nối
    for (const roomId in this.rooms) {
      const userIndex = this.rooms[roomId].indexOf(client.id);
      if (userIndex !== -1) {
        this.rooms[roomId].splice(userIndex, 1);
        // Thông báo cho những người còn lại trong phòng
        client.to(roomId).emit('user-left', client.id);
        console.log(`🚪 User ${client.id} left room ${roomId}. Remaining members: ${this.rooms[roomId].length > 0 ? this.rooms[roomId].join(', ') : 'None'}`);
        break;
      }
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.join(roomId);

    // Thông báo cho những người khác trong phòng rằng có user mới
    client.to(roomId).emit('user-joined', client.id);

    if (!this.rooms[roomId]) {
      this.rooms[roomId] = [];
    }
    this.rooms[roomId].push(client.id);

    // Improved logging với thông tin chi tiết hơn
    const currentMembers = this.rooms[roomId];
    const memberCount = currentMembers.length;
    console.log(`🚪 NEW USER JOINED ROOM:`);
    console.log(`   User ID: ${client.id}`);
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Time: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`   Total members in room: ${memberCount}`);
    console.log(`   All members: [${currentMembers.join(', ')}]`);
    console.log(`   ─────────────────────────────────────`);
  }

  // --- CÁC HÀM ĐƯỢC CẬP NHẬT ---

  @SubscribeMessage('offer')
  handleOffer(@ConnectedSocket() client: Socket, @MessageBody() data: { sdp: any; targetId: string }) {
    // Gửi offer chỉ tới targetId cụ thể
    console.log(`Forwarding offer from ${client.id} to ${data.targetId}`);
    client.to(data.targetId).emit('offer', { sdp: data.sdp, senderId: client.id });
  }

  @SubscribeMessage('answer')
  handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: { sdp: any; targetId: string }) {
    // Gửi answer chỉ tới targetId cụ thể
    console.log(`Forwarding answer from ${client.id} to ${data.targetId}`);
    client.to(data.targetId).emit('answer', { sdp: data.sdp, senderId: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: { candidate: any; targetId: string }) {
    // Gửi ice-candidate chỉ tới targetId cụ thể
    // console.log(`Forwarding ICE candidate from ${client.id} to ${data.targetId}`); // Log này có thể spam console
    client.to(data.targetId).emit('ice-candidate', { candidate: data.candidate, senderId: client.id });
  }
}