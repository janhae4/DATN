export const VIDEO_CHAT_PATTERNS = {
  // For microservice communication
  CREATE_GROUP_CALL: 'video-chat.create-group-call',
  CREATE_CALL: 'video-chat.createCall',
  GET_CALL_HISTORY: 'video-chat.getCallHistory',
};

// For WebSocket communication
export const WEBSOCKET_EVENTS = {
  GROUP_CALL_INVITATION: 'group-call-invitation', // Server to client: invite to a call
  JOIN_ROOM: 'join-room', // Client to server: accept and join
  NEW_USER_JOINED: 'new-user-joined', // Server to clients: notify of new member
  USER_LEFT: 'user-left', // Server to clients: notify of member leaving
  WEBRTC_SIGNAL: 'webrtc-signal', // C2S2C: Relay WebRTC offer/answer
  WEBRTC_ICE_CANDIDATE: 'webrtc-ice-candidate', // C2S2C: Relay network candidates
};
