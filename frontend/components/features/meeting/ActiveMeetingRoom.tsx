'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ControlsBar } from '@/components/features/meeting/ControlsBar';
import { VideoGrid } from '@/components/features/meeting/VideoGrid';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRecording } from '@/hooks/useRecording';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MeetingHeader } from '@/components/features/meeting/MeetingHeader';
import { TranscriptPanel, TranscriptMessage } from '@/components/features/meeting/TranscriptPanel';
import { ChatPanel } from '@/components/features/meeting/ChatPanel';
import { AISummaryPanel } from './AISummaryPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { RecordingRequestModal } from './RecordingRequestModal';
import { ToastContainer } from './ToastContainer';
import { videoChatService } from "@/services/videoChatService";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, Video, VideoOff, UserX } from "lucide-react";
import { VideoItem } from "./VideoItem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActiveMeetingProps {
  roomId: string;
  teamId: string;
  initialRoomInfo?: any;
}

export function ActiveMeetingRoom({ roomId, teamId, initialRoomInfo }: ActiveMeetingProps) {
  const router = useRouter();
  const { user } = useAuth();

  const {
    localStream,
    localScreenStream,
    remoteStreams,
    remoteScreenStreams,
    peerNames,
    peerMuteStates,
    peerCamStates,
    chatMessages,
    sendChatMessage,
    toggleScreenShare,
    isScreenSharing,
    toggleMic,
    toggleCam,
    isMicOn,
    isCamOn,
    isConnected,
    isLoading,
    error,
    activeSpeakerId,
    aiSummaryStream,
    isSummaryStreaming,
    recording: rtcRecording,
    pendingRecordingRequest,
    approvedRecordingId,
    recordingStopped,
    isRoomRecording,
    stopRoomRecording,
    clearApprovedRecordingId,
    clearRecordingStopped,
    myCallRole,
    canRecordDirectly,
    toasts,
    dismissToast,
    joinStatus,
    knockingUsers,
    joinErrorMessage,
    approveUser,
    rejectUser,
    joinWithPassword,
    kickUser,
    remoteMuteAudio,
    remoteMuteVideo,
    emit,
    socket,
    remoteTracks,
    remoteScreenTracks,
    isKicked,
    kickedMessage
  } = useWebRTC(roomId, initialRoomInfo);

  // Recording hook – behaviour adapts based on canRecordDirectly
  const recorder = useRecording(emit, roomId, canRecordDirectly);

  useEffect(() => {
    if (approvedRecordingId) {
      recorder.startRecording(approvedRecordingId);
      clearApprovedRecordingId();
    }
  }, [approvedRecordingId, recorder, clearApprovedRecordingId]);

  useEffect(() => {
    if (recordingStopped) {
      recorder.forceStop();
      clearRecordingStopped();
    }
  }, [recordingStopped, recorder, clearRecordingStopped]);

  const [showTranscript, setShowTranscript] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);

  // Kick confirmation state
  const [userToKick, setUserToKick] = useState<{ id: string, name: string } | null>(null);

  // Transcript via socket
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      setTranscripts(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        userId: data.userId,
        userName: peerNames.get(data.userId) || 'Unknown',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    };
    socket.on('transcript_received', handler);
    return () => socket.off('transcript_received', handler);
  }, [socket, peerNames]);

  const handleSpeechResult = (text: string) => {
    const userId = user?.id || '';
    socket?.emit('send_transcript', { content: text, roomId, userId });
    setTranscripts(prev => [...prev, {
      id: Date.now().toString(),
      userId,
      userName: 'You',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const { isListening, startListening, stopListening } = useSpeechRecognition(handleSpeechResult);

  // Automatically start/stop speech recognition based on microphone state and join status
  useEffect(() => {
    if (joinStatus === 'joined' && isMicOn && !isListening) {
      startListening();
    } else if ((joinStatus !== 'joined' || !isMicOn) && isListening) {
      stopListening();
    }
  }, [isMicOn, isListening, joinStatus, startListening, stopListening]);

  const toggleTranscriptPanel = () => {
    setShowParticipants(false);
    setShowChat(false);
    setShowAISummary(false);
    setShowTranscript(!showTranscript);
  };


  const leaveRoom = () => router.push(`/${teamId}`);

  const toggleChatPanel = () => {
    setShowTranscript(false);
    setShowParticipants(false);
    setShowAISummary(false);
    setShowChat(v => !v);
  };

  const toggleAISummaryPanel = () => {
    setShowTranscript(false);
    setShowParticipants(false);
    setShowChat(false);
    setShowAISummary(v => !v);
  };

  if (joinStatus === 'password_required') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 text-white p-4">
        {/* Preview Section */}
        <div className="mb-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="w-80 h-48 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-neutral-900 group relative">
            {localStream ? (
              <VideoItem
                stream={localStream}
                isLocal
                label="You"
                isCamOn={isCamOn}
                isMuted={!isMicOn}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-500">
                <VideoOff size={40} />
                <p className="text-xs mt-2 uppercase tracking-widest">Camera Off</p>
              </div>
            )}

            {/* Overlay Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80 hover:bg-red-500'}`}
              >
                {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
              <button
                onClick={toggleCam}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${isCamOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80 hover:bg-red-500'}`}
              >
                {isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Live Preview
          </div>
        </div>

        <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-4">Password Required</h2>
          <p className="text-neutral-400 mb-6">This meeting is protected. Please enter the password to join.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
            joinWithPassword(password);
          }}>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              className={`w-full bg-black/50 border ${joinErrorMessage ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 mb-2 focus:border-blue-500 outline-none transition-all`}
              autoFocus
            />
            {joinErrorMessage && (
              <p className="text-red-500 text-sm mb-4 animate-in fade-in slide-in-from-top-1">
                {joinErrorMessage}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 text-black rounded-xl h-11" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-500">Join Meeting</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (joinStatus === 'pending') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 text-white p-4">
        {/* Preview Section */}
        <div className="mb-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="w-80 h-48 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-neutral-900 group relative">
            {localStream ? (
              <VideoItem
                stream={localStream}
                isLocal
                label="You"
                isCamOn={isCamOn}
                isMuted={!isMicOn}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-500">
                <VideoOff size={40} />
                <p className="text-xs mt-2 uppercase tracking-widest">Camera Off</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center max-w-md text-center">
          <div className="relative mb-8">
            <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-blue-500/30 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Waiting for Approval</h2>
          <p className="text-neutral-400 mb-8 leading-relaxed">The host has been notified that you want to join. They'll let you in shortly.</p>
          <Button variant="outline" className="rounded-xl px-8 text-black" onClick={() => router.back()}>Exit Meeting</Button>
        </div>
      </div>
    );
  }

  if (joinStatus === 'denied') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 text-white p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Join Request Denied</h2>
          <p className="text-neutral-400 mb-8">{joinErrorMessage || "The host rejected your request to join this meeting."}</p>
          <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white overflow-hidden">

      {/* ── Toast notifications (top center) ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── Recording request modal – only for privileged users ── */}
      <RecordingRequestModal
        request={pendingRecordingRequest}
        onApprove={(recId) => {
          rtcRecording.approveRecording(recId);
        }}
        onReject={(recId) => {
          rtcRecording.rejectRecording(recId);
        }}
        canRespond={canRecordDirectly}
      />

      {/* ── Knocking Users (Lobby Approvals) ── */}
      {knockingUsers.length > 0 && (myCallRole === 'HOST' || myCallRole === 'ADMIN') && (
        <div className="fixed bottom-20 right-4 z-100 w-80 space-y-2">
          {knockingUsers.map(knocker => (
            <div key={knocker.userId} className="bg-neutral-900 border border-blue-500/30 p-4 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300">
              <p className="text-sm font-medium mb-3">{knocker.userName} wants to join</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-black" onClick={() => rejectUser(knocker.userId)}>Reject</Button>
                <Button size="sm" className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-500" onClick={() => approveUser(knocker.userId)}>Approve</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NÚT TEST 30 CÂU (Tự động xóa đi sau khi test xong) */}
      <div className="absolute top-16 left-4 z-50">
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-transform active:scale-95"
          onClick={() => {
            const mySentences = [
              "Xin chào mọi người tham gia họp.",
              "Hôm nay ta bàn về dự án mạng xã hội nội bộ.",
              "Team Backend ra sao rồi?",
              "Đang làm API login và profile.",
              "Xong JWT và chuẩn bị làm Redis Cache.",
              "Quá tốt, chờ frontend ghép.",
              "Xong 80% giao diện trang chủ rồi.",
              "Chiều nay có API, test luôn chứ?",
              "Đúng vậy, để em check Postman trước.",
              "Lỗi Egress ghi hình LiveKit xử lý được chưa?",
              "Em đã cấu hình tự tạo bucket trên MinIO.",
              "Để anh test lại xem có file mp4 chưa.",
              "Giọng nói tiếng Việt nhận diện ổn chứ?",
              "Đang code phần gom cụm 30 câu realtime.",
              "Ok, vậy ổn rồi. Giờ chờ kết quả từ AI."
            ];

            let index = 0;
            const timer = setInterval(() => {
              if (index >= 15) {
                clearInterval(timer);
                alert("Bạn đã gửi xong 15 câu!");
                return;
              }

              // Gửi câu hiện tại bằng tài khoản ĐANG ĐĂNG NHẬP ở tab này
              socket?.emit('send_transcript', {
                content: mySentences[index],
                roomId,
                userId: user?.id
              });

              // Hiển thị lên UI transcript của chính tab này
              setTranscripts(prev => [...prev, {
                id: `local-${index}-${Date.now()}`,
                userId: user?.id || 'me',
                userName: user?.name || 'You',
                content: mySentences[index],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }]);

              index++;
            }, 1000); // Mỗi 1 giây gửi 1 câu
          }}
        >
          🔥 Gửi 15 câu (Mỗi Tab bấm 1 phát)
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative flex flex-col bg-black">
          <MeetingHeader
            roomId={roomId}
            participantCount={remoteStreams.size + 1}
            onToggleParticipants={() => {
              setShowTranscript(false);
              setShowChat(false);
              setShowAISummary(false);
              setShowParticipants(v => !v);
            }}
            isRoomRecording={isRoomRecording}
          />

          <VideoGrid
            localStream={localStream}
            localScreenStream={localScreenStream}
            remoteStreams={remoteStreams}
            remoteScreenStreams={remoteScreenStreams}
            remoteTracks={remoteTracks}
            remoteScreenTracks={remoteScreenTracks}
            peerNames={peerNames}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            isScreenSharing={isScreenSharing}
            peerCamStates={peerCamStates}
            activeSpeakerId={activeSpeakerId}
            currentUserId={user?.id}
            peerMuteStates={peerMuteStates}
            myRole={myCallRole}
            onKick={(userId) => {
              const name = peerNames.get(userId) || `User ${userId.slice(0, 4)}`;
              setUserToKick({ id: userId, name });
            }}
            onMuteAudio={remoteMuteAudio}
            onMuteVideo={remoteMuteVideo}
          />

          <ControlsBar
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            isTranscriptOn={showTranscript}
            isChatOn={showChat}
            isAISummaryOpen={showAISummary}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onToggleTranscript={toggleTranscriptPanel}
            onToggleChat={toggleChatPanel}
            onToggleAISummary={toggleAISummaryPanel}
            onLeave={leaveRoom}
            isScreenSharing={isScreenSharing}
            onToggleScreenShare={toggleScreenShare}
            recording={recorder}
            canRecordDirectly={canRecordDirectly}
            isRoomRecording={isRoomRecording}
            onStopRoomRecording={stopRoomRecording}
          />
        </div>

        <TranscriptPanel
          isOpen={showTranscript}
          onClose={() => setShowTranscript(false)}
          messages={transcripts}
        />
        <ChatPanel
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          currentUserId={user?.id}
          peerNames={peerNames}
        />
        <AISummaryPanel
          isOpen={showAISummary}
          onClose={() => setShowAISummary(false)}
          roomId={roomId}
          myCallRole={myCallRole}
          streamContent={aiSummaryStream}
          isStreaming={isSummaryStreaming}
        />
        <ParticipantsPanel
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          peerNames={peerNames}
          remoteStreams={remoteStreams}
          peerCamStates={peerCamStates}
          localState={{ isMicOn, isCamOn }}
          peerMuteStates={peerMuteStates}
          myRole={myCallRole}
          onKick={(userId) => {
            const name = peerNames.get(userId) || `User ${userId.slice(0, 4)}`;
            setUserToKick({ id: userId, name });
          }}
          onMuteAudio={remoteMuteAudio}
          onMuteVideo={remoteMuteVideo}
        />
      </div>

      {/* ── Kick Confirmation Dialog ── */}
      <AlertDialog open={!!userToKick} onOpenChange={(open) => !open && setUserToKick(null)}>
        <AlertDialogContent className="bg-neutral-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              You are about to remove <span className="font-bold text-white">{userToKick?.name}</span> from the meeting. This user will be banned from re-joining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={() => {
                if (userToKick) {
                  kickUser(userToKick.id);
                  setUserToKick(null);
                }
              }}
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Kicked Notification Modal ── */}
      <Dialog open={isKicked} onOpenChange={() => leaveRoom()}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Removed from Meeting
            </DialogTitle>
            <DialogDescription className="text-neutral-400 pt-4">
              {kickedMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button
              onClick={leaveRoom}
              className="bg-white text-black hover:bg-white/90"
            >
              Return to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
