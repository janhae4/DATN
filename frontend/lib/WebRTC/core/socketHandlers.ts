import { Socket } from 'socket.io-client';
import { Peer, SignalingPayloads, SocketHandlers } from '../types';

// ==========================================
// SOCKET EVENT HANDLERS
// ==========================================

/**
 * Creates all socket event handlers for WebRTC signaling
 */
export function createSocketHandlers(
  socket: Socket,
  roomId: string,
  multi: boolean,
  createPeerConnection: (socketId: string) => RTCPeerConnection,
  setError: (error: string) => void,
  setJoined: (joined: boolean) => void,
  bumpPeersTick: () => void,
  peersRef: React.RefObject<Map<string, Peer>>
): SocketHandlers {
  return {
    onConnect: () => {
      console.log('Socket connected, attempting to join room:', roomId);
      socket.emit('join', { roomId });
      setJoined(true);
    },

    onJoined: async ({ peers }: SignalingPayloads['joined']) => {
      if (multi) {
        for (const peerId of peers) {
          if (peersRef.current.has(peerId)) continue;
          const pc = createPeerConnection(peerId);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId, sdp: offer, to: peerId });
          } catch (error) {
            console.error('Failed to create offer for peer:', peerId, error);
          }
        }
      }
    },

    onPeerJoined: async ({ socketId }: SignalingPayloads['peer-joined']) => {
      if (!multi) {
        // Skip if we already have a connection
        if (peersRef.current.has(socketId)) return;
        const pc = createPeerConnection(socketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, sdp: offer });
        } catch (error) {
          console.error('Failed to create offer for new peer:', socketId, error);
        }
      }
    },

    onOffer: async ({ from, sdp }: SignalingPayloads['offer']) => {
      const targetId = from;
      let pc = peersRef.current.get(targetId)?.pc;

      if (!pc) {
        pc = createPeerConnection(targetId);
      }

      try {
        // Polite glare handling: if we already have a local offer, rollback before taking remote offer
        if (pc.signalingState === 'have-local-offer') {
          try {
            await pc.setLocalDescription({ type: 'rollback' } as any);
          } catch (e) {
            console.warn('Rollback failed (glare handling):', e);
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
          roomId,
          sdp: answer,
          to: multi ? targetId : undefined
        });
      } catch (error) {
        console.error('Failed to handle offer from:', targetId, error);
      }
    },

    onAnswer: async ({ from, sdp }: SignalingPayloads['answer']) => {
      const targetId = from;
      const peer = peersRef.current.get(targetId);
      if (!peer) return;

      const pc = peer.pc;
      try {
        // Only accept an answer when we are in the correct state
        // This avoids errors like: Failed to set remote answer sdp: Called in wrong state: stable
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('Ignoring unexpected answer from', targetId, 'state =', pc.signalingState);
          return;
        }

        // Extra guard: if we already have an answer applied, ignore
        if (pc.remoteDescription?.type === 'answer') {
          console.warn('Duplicate answer from', targetId, 'ignored');
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (error) {
        console.error('Failed to handle answer from:', targetId, error);
      }
    },

    onIceCandidate: async ({ from, candidate }: SignalingPayloads['ice-candidate']) => {
      const targetId = from;
      const peer = peersRef.current.get(targetId);

      if (!peer) return;

      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn('Failed to add ICE candidate from:', targetId, error);
      }
    },

    onPeerLeft: ({ socketId }: SignalingPayloads['peer-left']) => {
      const peer = peersRef.current.get(socketId);

      if (peer) {
        peer.pc.close();
        peersRef.current.delete(socketId);
        bumpPeersTick();
      }
    },

    onRoomFull: () => {
      setError('Room is full');
    },

    onError: (error: any) => {
      console.warn('Socket error:', error?.message ?? error);
      setError(`Connection error: ${error?.message ?? error}`);
    },

    onJoinError: (error: any) => {
      console.error('Join failed:', error?.message ?? error);
      setError(`Failed to join room: ${error?.message ?? error}`);
      setJoined(false);
    },
  };
}
