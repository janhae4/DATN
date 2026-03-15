import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useLiveKitSpeech Hook
 * Dùng để trích xuất Audio Track từ LiveKit và gửi chunk sang Server thông qua WebSocket.
 * Server sẽ thực hiện Transcription (Speech-to-Text) bằng AI.
 */
export const useLiveKitSpeech = (
  localStream: MediaStream | null, 
  socket: any,
  roomId: string | null
) => {
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startListening = useCallback(() => {
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    // SỬA: Kiểm tra socket.connected thay vì readyState vì đây là wrapper h.emit
    if (!isListening || !localStream || !socket?.connected || !roomId) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log("🎙️ useLiveKitSpeech: Stopping recorder (Listening:", isListening, "Stream:", !!localStream, "Socket:", socket?.connected, ")");
        mediaRecorderRef.current.stop();
      }
      return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn("🎙️ useLiveKitSpeech: No Audio Track found in stream");
      return;
    }

    const audioStream = new MediaStream([audioTrack]);
    
    // Khởi tạo MediaRecorder
    // Sử dụng WebM/Opus vì nó nhẹ và Gemini hỗ trợ tốt
    const recorder = new MediaRecorder(audioStream, { 
      mimeType: 'audio/webm;codecs=opus' 
    });

    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && socket?.connected) {
        // Chuyển Blob sang Base64 để gửi qua JSON WebSocket
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Result có dạng "data:audio/webm;codecs=opus;base64,AAAA..."
          // Chúng ta chỉ lấy phần data sau dấu phẩy
          const base64Content = base64data.split(',')[1];

          console.log(`[语音] 🎙️ Đang gửi Audio Chunk (${event.data.size} bytes)`);

          // SỬA: Dùng socket.emit thay vì socket.send vì đây là socketWrapper
          socket.emit('audio_chunk', {
            chunk: base64Content,
            timestamp: Date.now(),
            roomId: roomId
          });
        };
        reader.readAsDataURL(event.data);
      }
    };

    // Chuẩn bị 3 giây (3000ms) mỗi chunk để AI có đủ context để dịch chính xác
    recorder.start(3000);
    mediaRecorderRef.current = recorder;

    console.log("🎙️ Server-side Transcription started...");

    return () => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    };
  }, [localStream, isListening, socket, roomId]);

  return { isListening, startListening, stopListening };
};
