'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ControlsBar } from '@/components/features/meeting/ControlsBar';
import { VideoGrid } from '@/components/features/meeting/VideoGrid';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MeetingHeader } from '@/components/features/meeting/MeetingHeader';
// Import Component mới tạo
import { TranscriptPanel, TranscriptMessage } from '@/components/features/meeting/TranscriptPanel';

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  // Custom hooks
  const { localStream, remoteStreams, peerNames, socket } = useWebRTC(roomId);
  
  // UI State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [peerCamStates, setPeerCamStates] = useState<Map<string, boolean>>(new Map());
  
  // --- NEW: State cho Transcript Panel ---
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);

  // 1. Logic xử lý socket nhận transcript từ người khác
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe sự kiện 'transcript_received' từ server
    // (Giả định server emit event này khi có ai đó gửi transcript)
    const handleTranscriptReceived = (data: any) => {
      const newMessage: TranscriptMessage = {
        id: Date.now().toString() + Math.random(), // Fallback ID
        userId: data.userId,
        userName: peerNames.get(data.userId) || 'Unknown', // Map tên từ ID nếu có
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setTranscripts((prev) => [...prev, newMessage]);
    };

    socket.on('transcript_received', handleTranscriptReceived);

    return () => {
      socket.off('transcript_received', handleTranscriptReceived);
    };
  }, [socket, peerNames]);

  // 2. Xử lý khi Speech Recognition nhận diện giọng nói local
  const handleSpeechResult = (text: string) => {
    console.log("🗣️ User said:", text);
    const userId = 'CURRENT_USER_ID'; // Lấy từ auth context thực tế của bạn

    // Emit lên server
    socket?.emit('send_transcript', {
      content: text,
      roomId: roomId,
      userId: userId
    });

    // Cập nhật UI ngay lập tức (Optimistic Update) để người dùng thấy mình vừa nói
    const myMessage: TranscriptMessage = {
      id: Date.now().toString(),
      userId: userId,
      userName: 'Bạn',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTranscripts(prev => [...prev, myMessage]);
  };

  const { isListening, startListening, stopListening } = useSpeechRecognition(handleSpeechResult);

  // 3. Toggle Panel Transcript
  const toggleTranscriptPanel = () => {
    const newState = !showTranscript;
    setShowTranscript(newState);
    
    // Logic phụ: Tự động bật/tắt nhận diện giọng nói khi mở/đóng panel (Tuỳ chọn UX)
    // Nếu muốn tách biệt (nút bật panel riêng, nút bật mic riêng) thì bỏ đoạn này đi.
    if (newState && !isListening) {
      startListening();
    } else if (!newState && isListening) {
      stopListening();
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

  const leaveRoom = () => {
    router.push(`/${params.teamId}/meeting`);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white overflow-hidden">
      
      {/* Header luôn cố định ở trên */}
      <MeetingHeader roomId={roomId} participantCount={remoteStreams.size + 1} />

      {/* Main Content: Dùng flex-1 để chiếm toàn bộ chiều cao còn lại */}
      {/* Flex Row để VideoGrid và TranscriptPanel nằm ngang nhau */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* VideoGrid Area: Chiếm phần còn lại */}
        <div className={`flex-1 transition-all duration-300 ${showTranscript ? 'mr-0' : ''}`}>
           <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            peerNames={peerNames}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            peerCamStates={peerCamStates}
          />
        </div>

        {/* Transcript Panel (Sidebar) */}
        <TranscriptPanel 
          isOpen={showTranscript} 
          onClose={() => setShowTranscript(false)}
          messages={transcripts}
        />
        
      </div>

      {/* Controls Bar luôn cố định ở dưới */}
      <ControlsBar
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        // Button này giờ sẽ bật/tắt Panel hiển thị
        isTranscriptOn={showTranscript} 
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        // Logic: Click nút -> Toggle Panel (và trigger speech recognition bên trong hàm toggle)
        onToggleTranscript={toggleTranscriptPanel} 
        onLeave={leaveRoom}
      />
    </div>
  );
}