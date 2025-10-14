'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateVideoCallPage() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    const newRoomId = roomId.trim() || generateRoomId();
    
    try {
      // Gọi API để tạo cuộc gọi trong DB
      const response = await fetch('http://localhost:3000/video-chat/create-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: newRoomId,
          participantIds: [], // Có thể thêm user ID nếu cần
        }),
      });
      
      if (response.ok) {
        // Lưu roomId vào localStorage để đánh dấu đã tạo
        localStorage.setItem('createdRoomId', newRoomId);
        router.push(`/video-call/${newRoomId}`);
      } else {
        alert('Không thể tạo phòng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi tạo phòng:', error);
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) return;
    
    setIsCreating(true);
    try {
      // Kiểm tra phòng có tồn tại không bằng cách gọi API lấy lịch sử cuộc gọi
      const response = await fetch(`http://localhost:3000/video-chat/call-history?roomId=${roomId.trim()}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const callHistory = await response.json();
        if (callHistory && callHistory.length > 0) {
          router.push(`/video-call/${roomId.trim()}`);
        } else {
          alert('Phòng không tồn tại. Vui lòng kiểm tra ID phòng hoặc tạo phòng mới.');
        }
      } else {
        alert('Không thể kiểm tra phòng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra phòng:', error);
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', color: '#333', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '30px' }}>Video Call</h1>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Nhập Room ID (hoặc để trống để tạo mới)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {isCreating ? 'Đang Tạo...' : roomId.trim() ? 'Tham Gia Phòng' : 'Tạo Phòng Mới'}
          </button>
          {roomId.trim() && (
            <button
              onClick={handleJoinRoom}
              disabled={isCreating}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
              }}
            >
              Tham Gia
            </button>
          )}
        </div>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          {roomId.trim() ? `Sẽ tham gia phòng: ${roomId}` : 'Để trống để tạo phòng ngẫu nhiên'}
        </div>
      </div>
    </div>
  );
}