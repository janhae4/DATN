// ==========================================
// WEBRTC TYPES AND INTERFACES
// ==========================================

export interface UseWebRTCOptions {
  roomId: string;
  signalingUrl: string;
  iceServers?: RTCIceServer[];
  autoStartLocal?: boolean;
  multi?: boolean;
}

export interface WebRTCHookReturn {
  joined: boolean;
  error: string | null;
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  startLocal: () => Promise<void>;
  stopLocal: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isConnected: boolean;
}

export interface SignalingPayloads {
  join: { roomId: string };
  leave: Record<string, never>;
  offer: { from: string; sdp: RTCSessionDescriptionInit; roomId?: string; to?: string };
  answer: { from: string; sdp: RTCSessionDescriptionInit; roomId?: string; to?: string };
  'ice-candidate': { from: string; candidate: RTCIceCandidateInit; roomId?: string; to?: string };
  'peer-joined': { socketId: string };
  'peer-left': { socketId: string };
  joined: { peers: string[] };
  'room-full': { roomId: string };
}

export type Peer = {
  pc: RTCPeerConnection;
  stream: MediaStream;
};

export interface SocketHandlers {
  onConnect: () => void;
  onJoined: (payload: SignalingPayloads['joined']) => Promise<void>;
  onPeerJoined: (payload: SignalingPayloads['peer-joined']) => Promise<void>;
  onOffer: (payload: SignalingPayloads['offer']) => Promise<void>;
  onAnswer: (payload: SignalingPayloads['answer']) => Promise<void>;
  onIceCandidate: (payload: SignalingPayloads['ice-candidate']) => Promise<void>;
  onPeerLeft: (payload: SignalingPayloads['peer-left']) => void;
  onRoomFull: () => void;
  onJoinError: (error: any) => void;
  onError: (error: any) => void;
}


export interface UseWebRTCLocalMediaReturn {
  localStream: MediaStream | null;
  error: string | null;
  startLocal: () => Promise<void>;
  stopLocal: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  addTracksToPeerConnection: (peerConnection: RTCPeerConnection) => void;
  localStreamRef: React.RefObject<MediaStream | null>;
}