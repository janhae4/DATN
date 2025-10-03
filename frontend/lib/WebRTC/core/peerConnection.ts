import { Socket } from 'socket.io-client';
import { Peer } from '../types';

// ==========================================
// PEER CONNECTION UTILITIES
// ==========================================

/**
 * Creates a new RTCPeerConnection with proper event handlers for WebRTC signaling
 */
export function createPeerConnection(
  socketId: string,
  iceServers: RTCIceServer[],
  roomId: string,
  socket: Socket,
  multi: boolean,
  bumpPeersTick: () => void,
  localStreamRef: React.RefObject<MediaStream | null>,
  remoteStream: MediaStream
): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers });

  // Handle remote stream
  pc.ontrack = (event) => {
    // Thêm track vào remoteStream.
    if (event.streams && event.streams[0]) {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
    } else if (event.track) {
      remoteStream.addTrack(event.track);
    }
    bumpPeersTick();
  };

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    // Gửi ICE candidate đến peer khác.
    if (event.candidate) {
      socket.emit('ice-candidate', {
        roomId,
        candidate: event.candidate.toJSON(),
        // Chỉ gửi ICE candidate đến peer khác trong phòng nếu là phòng đa người.
        to: multi ? socketId : undefined,
      });
    }
  };

  // Add local stream tracks
  const localStream = localStreamRef.current;
  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  return pc;
}

/**
 * Creates a peer connection and stores it in the peers map
 */
export function createAndStorePeerConnection(
  socketId: string, // socket ID của peer bên kia (khóa để tra cứu).
  iceServers: RTCIceServer[], // servers ICE.
  roomId: string, // ID phòng.
  socket: Socket, // socket.
  multi: boolean, // phòng đa người.
  bumpPeersTick: () => void, // callback để trigger re-render khi danh sách peer thay đổi.
  localStreamRef: React.RefObject<MediaStream | null>,
  peersRef: React.RefObject<Map<string, Peer>>,
  addTracksToPeerConnection: (peerConnection: RTCPeerConnection) => void
): RTCPeerConnection {
  // Create remote stream first and ensure it's the one wired to ontrack
  const remoteStream = new MediaStream();
  const pc = createPeerConnection(
    socketId, 
    iceServers, 
    roomId, 
    socket, 
    multi,
    bumpPeersTick, 
    localStreamRef, 
    remoteStream 
  );


  // Lưu vào peersRef để cleanup.
  peersRef.current.set(socketId, { pc, stream: remoteStream });

  bumpPeersTick();
  return pc;
}
