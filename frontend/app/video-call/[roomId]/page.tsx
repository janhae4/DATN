'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVideoCall } from '@/hooks/useVideoCall';

export default function VideoCallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null)

  const { localStream, peers, isVideoMuted, toggleVideoMute, isAudioMuted, toggleAudioMute, isLoading } = useVideoCall(roomId || '');

  useEffect(() => {
    const checkRoomExists = async () => {
      if (!roomId) return;
      
      try {
        const response = await fetch(`http://localhost:3000/video-chat/call-history?roomId=${roomId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const callHistory = await response.json();
          setRoomExists(callHistory && callHistory.length > 0);
        } else {
          setRoomExists(false);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra phòng:', error);
        setRoomExists(false);
      }
    };

    checkRoomExists();
  }, [roomId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      // Force play nếu autoplay không hoạt động
      localVideoRef.current.play().catch((error) => {
        console.warn('Autoplay failed, video may need user interaction:', error);
      });
    }
  }, [localStream]);

  if (roomExists === false) {
    return (
      <div style={{ padding: '50px', fontFamily: 'sans-serif', color: '#333', textAlign: 'center' }}>
        <h1>Phòng Không Tồn Tại</h1>
        <p>Room ID "{roomId}" không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={() => router.push('/video-call')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Quay Lại Tạo Phòng Mới
        </button>
      </div>
    );
  }

  if (roomExists === null) {
    return (
      <div style={{ padding: '50px', fontFamily: 'sans-serif', color: '#333', textAlign: 'center' }}>
        <h1>Đang Kiểm Tra Phòng...</h1>
        <p>Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      <h1 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Video Call Room: {roomId}</h1>
      {isLoading && (
        <div style={{ marginBottom: '20px', color: '#007bff' }}>
          Đang kết nối camera và tham gia phòng...
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={toggleVideoMute}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isVideoMuted ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isVideoMuted ? 'Bật Camera' : 'Tắt Camera'}
        </button>
        <span style={{ marginLeft: '10px', color: isVideoMuted ? '#dc3545' : '#28a745' }}>
          Camera: {isVideoMuted ? 'Tắt' : 'Bật'}
        </span>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={toggleAudioMute}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isAudioMuted ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isAudioMuted ? 'Bật Mic' : 'Tắt Mic'}
        </button>
        <span style={{ marginLeft: '10px', color: isAudioMuted ? '#dc3545' : '#28a745' }}>
          Mic: {isAudioMuted ? 'Tắt' : 'Bật'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ border: '2px solid #007bff', borderRadius: '8px', padding: '5px' }}>
          <h2>You</h2>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', borderRadius: '4px' }} />
        </div>

        {Object.entries(peers).map(([peerId, stream]) => (
          <div key={peerId} style={{ border: '2px solid #28a745', borderRadius: '8px', padding: '5px' }}>
            <h2>Peer: {peerId.substring(0, 6)}</h2>
            <video
              autoPlay
              playsInline
              style={{ width: '300px', borderRadius: '4px' }}
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}