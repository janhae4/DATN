// ==========================================
// WEBRTC HOOKS - MAIN EXPORTS
// ==========================================

// Types
export type {
  UseWebRTCOptions,
  WebRTCHookReturn,
  SignalingPayloads,
  Peer,
  SocketHandlers,
} from './types';

// Supporting hooks and utilities
export { useLocalMedia } from './hooks/useLocalMedia';
export { useWebRTCLocalMedia } from './hooks/useWebRTCLocalMedia';
export type { UseWebRTCLocalMediaReturn } from './hooks/useWebRTCLocalMedia';

// Utilities
export { createPeerConnection, createAndStorePeerConnection } from './core/peerConnection';
export { createSocketHandlers } from './core/socketHandlers';
