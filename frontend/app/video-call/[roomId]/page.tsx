"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  CameraOff,
  Users,
  Captions,
  UserIcon,
  Sparkles,
  MonitorUp,
  CheckCircle,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSocket } from "@/app/SocketContext";
import { ApiService } from "@/app/demo/chat-team/services/api-service";
import { CurrentUser } from "@/app/demo/chat-team/types/type";
import { useIsSpeaking } from "../hooks/useAudioLevel";

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface KickRequestPayload {
  requesterId: string;
  requesterName: string;
  targetUserId: string;
  targetUserName: string;
  roomId: string;
  message: string;
  type?: "kick" | "unkick";
}

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

function RemoteVideo({
  userInfo,
  stream,
  isMuted,
}: {
  userInfo: CurrentUser;
  stream: MediaStream;
  isMuted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const isSpeaking = useIsSpeaking(stream);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    videoEl.srcObject = stream;

    const checkVideoState = () => {
      const videoTrack = stream.getVideoTracks()[0];
      const isVideoEnabled =
        videoTrack && videoTrack.enabled && videoTrack.readyState === "live";
      setHasVideo(!!isVideoEnabled);

      if (isVideoEnabled && videoEl.paused) {
        videoEl.play().catch((e) => console.error("Auto-play failed:", e));
      }
    };

    checkVideoState();

    const handleTrackChange = () => {
      console.log("Track status changed, refreshing video...");
      videoEl.srcObject = stream;
      checkVideoState();
    };

    stream.addEventListener("addtrack", handleTrackChange);
    stream.addEventListener("removetrack", handleTrackChange);

    stream.getVideoTracks().forEach((track) => {
      track.onmute = () => setHasVideo(false);
      track.onunmute = () => {
        console.log("Track unmuted (data flowing)");
        handleTrackChange();
      };
      track.onended = () => setHasVideo(false);
    });

    const intervalId = setInterval(checkVideoState, 1000);

    return () => {
      clearInterval(intervalId);
      stream.removeEventListener("addtrack", handleTrackChange);
      stream.removeEventListener("removetrack", handleTrackChange);
    };
  }, [stream]);

  return (
    <div
      className={`relative bg-gray-800 rounded-xl overflow-hidden aspect-video shadow-lg transition-all duration-200 
      ${
        isSpeaking
          ? "ring-4 ring-green-500 shadow-green-500/50 scale-[1.02] z-10"
          : "border border-gray-700"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        // Thêm key để React hủy và tạo lại thẻ video nếu stream ID thay đổi (cực đoan nhưng hiệu quả)
        key={stream.id}
        className={`w-full h-full bg-black ${!hasVideo ? "hidden" : "block"}`}
        // QUAN TRỌNG: Dùng contain để nhìn thấy toàn bộ màn hình share (tránh bị zoom mất góc)
        style={{ objectFit: "contain" }}
      />

      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 flex-col gap-3">
          {userInfo?.avatar ? (
            <img
              src={userInfo.avatar}
              alt={userInfo.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-white">
              <UserIcon size={32} />
            </div>
          )}
          <div className="text-center">
            <p className="text-white font-semibold">
              {userInfo?.name || "Unknown User"}
            </p>
            <p className="text-gray-400 text-xs">Camera đang tắt</p>
          </div>
        </div>
      )}

      {/* Phần tên user góc dưới */}
      <div className="absolute bottom-2 left-2 flex gap-2">
        <div className="bg-black/60 px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2 backdrop-blur-sm">
          {userInfo?.name || "..."}
          {isSpeaking && (
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-full bg-green-400 animate-pulse"></span>
              <span className="w-0.5 h-2/3 bg-green-400 animate-pulse delay-75"></span>
              <span className="w-0.5 h-full bg-green-400 animate-pulse delay-150"></span>
            </span>
          )}
        </div>
      </div>

      {/* Icon Mute góc trên */}
      {isMuted && (
        <div className="absolute top-3 right-3 bg-red-600/90 p-2 rounded-full shadow-lg backdrop-blur-sm z-20">
          <MicOff size={16} className="text-white" />
        </div>
      )}

      {/* Icon Speaking góc trên */}
      {!isMuted && isSpeaking && (
        <div className="absolute top-2 right-2 bg-green-500 p-1.5 rounded-full shadow-lg animate-bounce">
          <Mic size={14} className="text-white" fill="white" />
        </div>
      )}
    </div>
  );
}

export default function VideoCallPage() {
  const { socket, isConnected } = useSocket();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = params?.roomId as string;
  const teamId = searchParams?.get("teamId") || "default-team";

  const [kickRequest, setKickRequest] = useState<KickRequestPayload | null>(
    null
  );

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasVideoDevice, setHasVideoDevice] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedManuallyRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

  const [showAiRequest, setShowAiRequest] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const recognitionRef = useRef<any>(null);
  const isLocalSpeaking = useIsSpeaking(localStream);
  const showLocalSpeakingIndicator = isLocalSpeaking && !isMuted;

  const [remoteUsersInfo, setRemoteUsersInfo] = useState<
    Map<string, CurrentUser>
  >(new Map());
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const res = await ApiService.getInfo();
      setUser(res);
    };

    fetchInfo();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const initMedia = async () => {
      if (
        window.location.hostname !== "localhost" &&
        window.location.protocol !== "https:"
      ) {
        alert("LỖI: Camera chỉ hoạt động trên localhost hoặc https!");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Trình duyệt của bạn không hỗ trợ gọi video.");
        return;
      }

      try {
        console.log("🔽 Đang yêu cầu quyền truy cập...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (isMuted) {
          stream.getAudioTracks().forEach((track) => (track.enabled = false));
        }

        if (isCancelled) {
          console.log("Component unmounted, hủy stream vừa lấy.");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        console.log("✅ Đã cấp quyền thành công. Stream ID:", stream.id);

        localStreamRef.current = stream;
        setLocalStream(stream);
        setHasVideoDevice(true);
        setIsVideoOff(false);
      } catch (err: any) {
        console.error("❌ Lỗi getUserMedia:", err);

        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          alert(
            "Bạn đã chặn quyền truy cập. Vui lòng mở khóa trên thanh địa chỉ (biểu tượng ổ khóa)."
          );
          return;
        }
        try {
          if (isCancelled) return;

          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });

          if (isCancelled) {
            audioStream.getTracks().forEach((t) => t.stop());
            return;
          }

          console.log("✅ Đã mở Mic thành công (Chế độ không Camera).");
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);

          setHasVideoDevice(false);
          setIsVideoOff(true);
        } catch (audioErr) {
          console.error("❌ Thất bại cả Audio:", audioErr);
          alert(
            "Không thể truy cập thiết bị (cả Mic và Camera đều không khả dụng)."
          );
        }
      }
    };

    initMedia();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        console.log("🛑 Dọn dẹp stream cũ...");
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("Attaching stream to local video element");
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // --- Web Speech API Logic ---
  useEffect(() => {
    if (typeof window !== "undefined" && isSpeechEnabled) {
      isStoppedManuallyRef.current = false;

      const { webkitSpeechRecognition, SpeechRecognition } =
        window as unknown as IWindow;
      const SpeechApi = SpeechRecognition || webkitSpeechRecognition;
      if (!SpeechApi) {
        console.warn("Trình duyệt không hỗ trợ Web Speech API");
        return;
      }

      const recognition = new SpeechApi();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "vi-VN";

      recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript && socket && isConnected) {
          socket.emit("send_transcript", {
            roomId,
            teamId,
            userId: user?.id as string,
            text: finalTranscript.trim(),
            timestamp: new Date().toISOString(),
          });
        }

        if (
          (interimTranscript || finalTranscript) &&
          !isStoppedManuallyRef.current
        ) {
          silenceTimerRef.current = setTimeout(() => {
            recognition.stop();
          }, 1500);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "aborted") return;
        if (event.error === "no-speech") {
          console.warn("AI Listening: Đang chờ giọng nói...");
        } else {
          console.error("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        console.log("AI Listening: Restarting...");
        if (!isStoppedManuallyRef.current && isSpeechEnabled) {
          console.log("Restarting recognition for next chunk...");
          try {
            recognition.start();
          } catch (e) {}
        } else {
          console.log("Speech recognition stopped completely.");
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.error("Start error:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        isStoppedManuallyRef.current = true;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isSpeechEnabled, socket, isConnected, roomId, teamId]);

  useEffect(() => {
    if (!socket || !localStream || !isConnected || !roomId || !user) return;
    socket.emit("join_video_room", { roomId, teamId, userInfo: user });

    if (isMuted) {
      socket.emit("user_toggle_audio", {
        roomId,
        userId: user.id,
        isMuted: true,
      });
    }
    const createPeerConnection = (targetUserId: string) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice_candidate", {
            candidate: event.candidate,
            targetUserId,
            roomId,
          });
        }
      };
      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const newStreams = new Map(prev);
          newStreams.set(targetUserId, event.streams[0]);
          return newStreams;
        });
      };
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));
      return pc;
    };

    const handleUserJoined = async ({
      userInfo,
    }: {
      userInfo: CurrentUser;
    }) => {
      setRemoteUsersInfo((prev) => new Map(prev).set(userInfo.id, userInfo));
      const pc = createPeerConnection(userInfo.id);
      peersRef.current[userInfo.id] = pc;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
          sdp: offer,
          targetUserId: userInfo.id,
          roomId,
          userInfo: user,
        });
      } catch (e) {
        console.error(e);
      }
    };

    const handleOffer = async ({ sdp, senderId, userInfo }: any) => {
      if (userInfo)
        setRemoteUsersInfo((prev) => new Map(prev).set(senderId, userInfo));
      let pc = peersRef.current[senderId];
      if (!pc) {
        pc = createPeerConnection(senderId);
        peersRef.current[senderId] = pc;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { sdp: answer, targetUserId: senderId, roomId });
      } catch (e) {}
    };

    const handleAnswer = async ({ sdp, senderId }: any) => {
      const pc = peersRef.current[senderId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleIceCandidate = async ({ candidate, senderId }: any) => {
      const pc = peersRef.current[senderId];
      if (pc && candidate)
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleUserLeft = ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      if (reason === "KICKED") {
        console.log(`User ${userId} đã bị kick khỏi phòng.`);
      }

      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(userId);
        return newStreams;
      });
      setRemoteUsersInfo((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    const handleReqStartSpeechAI = () => {
      if (!isSpeechEnabled) {
        setShowAiRequest(true);
      }
    };

    const handleUserToggleAudio = ({
      userId,
      isMuted,
    }: {
      userId: string;
      isMuted: boolean;
    }) => {
      console.log("User", userId, "is muted:", isMuted);
      setMutedUsers((prev) => {
        const newSet = new Set(prev);
        if (isMuted) {
          newSet.add(userId);
        } else {
          console.log("Unmuting user:", userId);
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    const handleUserToggleVideo = ({
      userId,
      isVideoOff,
    }: {
      userId: string;
      isVideoOff: boolean;
    }) => {
      console.log(`User ${userId} đã ${isVideoOff ? "tắt" : "bật"} video.`);
      if (isVideoOff) {
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          const stream = newMap.get(userId);
          if (stream) {
            stream.getVideoTracks().forEach((t) => (t.enabled = false));
            newMap.set(userId, stream);
          }
          return newMap;
        });
      }
    };

    socket.on("user_toggle_video", handleUserToggleVideo);

    socket.on("user_joined_video", handleUserJoined);
    socket.on("req_start_speech_ai", handleReqStartSpeechAI);
    socket.on("user_toggle_audio", handleUserToggleAudio);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("user_left_video", handleUserLeft);

    return () => {
      socket.off("user_joined_video", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("user_left_video", handleUserLeft);
      socket.off("req_start_speech_ai", handleReqStartSpeechAI);
      socket.off("user_toggle_audio", handleUserToggleAudio);
      socket.off("user_toggle_video", handleUserToggleVideo);
      socket.emit("leave_video_room", { roomId });
      Object.values(peersRef.current).forEach((pc) => pc.close());
    };
  }, [socket, isConnected, localStream, roomId, teamId, user]);

  useEffect(() => {
    if (!socket) return;

    const handleRequestKick = (payload: any) => {
      console.log("Received kick request:", payload);
      setKickRequest({ ...payload, type: "kick" });
    };

    const handleRequestUnkick = (payload: any) => {
      console.log("Received unkick request:", payload);
      setKickRequest({ ...payload, type: "unkick" });
    };

    const handleYouAreKicked = (payload: {
      message: string;
      reason?: string;
    }) => {
      alert(`BẠN ĐÃ BỊ KICK!\nLý do: ${payload.message || payload.reason}`);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      router.push(`/`);
    };

    const handleYouAreUnkicked = (payload: { message: string }) => {
      alert(`THÔNG BÁO: ${payload.message}`);
    };

    socket.on("request-kick", handleRequestKick);
    socket.on("request-unkick", handleRequestUnkick);
    socket.on("you-are-kicked", handleYouAreKicked);
    socket.on("you-are-unkicked", handleYouAreUnkicked);

    return () => {
      socket.off("request-kick", handleRequestKick);
      socket.off("request-unkick", handleRequestUnkick);
      socket.off("you-are-kicked", handleYouAreKicked);
      socket.off("you-are-unkicked", handleYouAreUnkicked);
    };
  }, [socket, router]);

  const handleConfirmKickAction = async () => {
    if (!kickRequest || !user) return;

    try {
      console.log("Executing kick/unkick:", kickRequest);
      if (kickRequest.type === "kick") {
        await ApiService.kickUserFromVideoCall(
          kickRequest.targetUserId,
          kickRequest.roomId
        );
      } else {
        await ApiService.unKickUserFromVideoCall(
          kickRequest.targetUserId,
          kickRequest.roomId
        );
      }
      setKickRequest(null);
    } catch (error) {
      console.error("Failed to execute kick/unkick:", error);
      alert("Có lỗi xảy ra khi thực hiện lệnh.");
    }
  };

  const stopScreenSharing = async () => {
    console.log("[DEBUG] Bắt đầu stopScreenSharing...");
    console.log("[DEBUG] Trạng thái hiện tại: isVideoOff =", isVideoOff);

    if (screenStreamRef.current) {
      console.log("[DEBUG] Tìm thấy stream màn hình, đang stop track...");
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    } else {
      console.log("[DEBUG] Không tìm thấy stream màn hình trong ref.");
    }

    setIsScreenSharing(false);

    const handleStopVideo = async () => {
      console.log("[DEBUG] Chạy vào handleStopVideo (Tắt hẳn video)...");

      const peers = Object.values(peersRef.current);
      console.log(`[DEBUG] Tìm thấy ${peers.length} peers để xử lý.`);

      for (const pc of peers) {
        if (pc.signalingState === "closed") {
          console.log("[DEBUG] Peer đã đóng, bỏ qua.");
          continue;
        }

        const sender = pc.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          console.log("[DEBUG] Đang replaceTrack(null) cho peer...");
          try {
            await sender.replaceTrack(null);
            console.log("[DEBUG] replaceTrack(null) thành công.");
          } catch (e) {
            console.error("[DEBUG] Lỗi replaceTrack(null):", e);
          }
        } else {
          console.log("[DEBUG] Không tìm thấy video sender cho peer này.");
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      console.log("[DEBUG] Gửi socket user_toggle_video (tắt)...");
      socket?.emit("user_toggle_video", {
        roomId,
        userId: user?.id,
        isVideoOff: true,
      });
    };

    if (!isVideoOff) {
      console.log("[DEBUG] Case A: Camera đang bật -> Thử lấy lại camera...");
      try {
        const newCameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        console.log(
          "[DEBUG] Đã lấy được stream camera mới:",
          newCameraStream.id
        );

        const videoTrack = newCameraStream.getVideoTracks()[0];

        const promises = Object.values(peersRef.current).map(async (pc) => {
          if (pc.signalingState === "closed") return;
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            console.log("[DEBUG] Replace track camera cho peer...");
            await sender.replaceTrack(videoTrack);
          }
        });
        await Promise.all(promises);
        console.log("[DEBUG] Đã replace track camera cho tất cả peer.");

        if (localVideoRef.current && localStream) {
          const oldTracks = localStream.getVideoTracks();
          oldTracks.forEach((t) => {
            localStream.removeTrack(t);
            t.stop();
          });
          localStream.addTrack(videoTrack);

          localVideoRef.current.srcObject = null;
          setTimeout(() => {
            if (localVideoRef.current)
              localVideoRef.current.srcObject = localStream;
          }, 50);
        }

        setIsVideoOff(false);

        socket?.emit("user_toggle_video", {
          roomId,
          userId: user?.id,
          isVideoOff: false,
        });
      } catch (err) {
        console.error("[DEBUG] Lỗi khi bật lại camera:", err);
        await handleStopVideo();
        setIsVideoOff(true);
      }
    } else {
      console.log("[DEBUG] Case B: Camera đang tắt -> Gọi handleStopVideo.");
      await handleStopVideo();
    }
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenSharing();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      screenTrack.onended = () => {
        stopScreenSharing();
      };

      for (const [targetUserId, pc] of Object.entries(peersRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          console.log(`Replacing track for user ${targetUserId}`);
          await sender.replaceTrack(screenTrack);
        } else {
          console.log(
            `Adding new track for user ${targetUserId} (No camera mode)`
          );

          pc.addTrack(screenTrack, localStream || screenStream);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket?.emit("offer", {
            sdp: offer,
            targetUserId: targetUserId,
            roomId,
            userInfo: user,
          });
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        if (localVideoRef.current.classList.contains("hidden")) {
          localVideoRef.current.classList.remove("hidden");
        }
      }

      setIsScreenSharing(true);
      if (!hasVideoDevice) {
        setIsVideoOff(false);
      }
    } catch (err) {
      console.error("Lỗi share màn hình:", err);
      setIsScreenSharing(false);
    }
  };

  const handleAcceptAi = () => {
    setIsSpeechEnabled(true);
    setShowAiRequest(false);
  };

  const toggleMute = () => {
    console.log("Toggle mute...");
    if (localStream) {
      localStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      const newMutedState = !isMuted;
      setIsMuted(!isMuted);

      if (socket) {
        setIsSpeechEnabled(false);
        socket.emit("user_toggle_audio", {
          roomId,
          userId: user?.id,
          isMuted: newMutedState,
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && hasVideoDevice) {
      localStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeech = () => {
    if (isSpeechEnabled) isStoppedManuallyRef.current = true;
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  const requestAllToTurnOnAI = () => {
    if (socket && isConnected) {
      socket.emit("req_start_speech_ai", { roomId });
      alert("Đã gửi yêu cầu bật AI đến mọi người trong phòng!");
    }

    if (!isSpeechEnabled) {
      handleAcceptAi();
    }
  };

  const totalParticipants = 1 + remoteStreams.size;
  const getGridClass = () => {
    if (totalParticipants === 1) return "grid-cols-1 max-w-4xl mx-auto";
    if (totalParticipants === 2) return "grid-cols-1 md:grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-1 md:grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-4";
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-900 text-white font-sans overflow-hidden">
        <header className="flex-none flex justify-between items-center px-4 py-3 bg-gray-800 border-b border-gray-700 z-20">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Video className="text-blue-500" size={20} />
              Phòng: {roomId}
            </h1>
            <span className="text-xs text-gray-400">Team: {teamId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {isSpeechEnabled && (
              <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/50 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles size={10} /> AI Listening
              </span>
            )}
          </div>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg transition-colors ${
              showParticipants
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Danh sách thành viên"
          >
            <Users size={20} />
            <span className="ml-1 text-sm font-bold">
              {1 + remoteUsersInfo.size}
            </span>
          </button>
        </header>

        {/* MAIN GRID VIDEO AREA */}
        <main className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
          <div
            className={`grid gap-4 w-full h-full content-center transition-all duration-300 ${getGridClass()}`}
          >
            <div
              className={`relative bg-gray-800 rounded-xl overflow-hidden w-full h-full shadow-lg transition-all duration-200 
                ${
                  showLocalSpeakingIndicator
                    ? "ring-4 ring-green-500 shadow-green-500/50 z-10"
                    : "border border-gray-700"
                }`}
              style={{ minHeight: totalParticipants > 1 ? "200px" : "auto" }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted={true}
                className={`w-full h-full object-cover 
                  ${isScreenSharing ? "" : "transform scale-x-[-1]"} 
                  ${isVideoOff && !isScreenSharing ? "hidden" : ""}
                `}
              />

              {(isVideoOff || !hasVideoDevice) && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 flex-col gap-2">
                  {hasVideoDevice ? (
                    <VideoOff className="text-gray-400" size={40} />
                  ) : (
                    <CameraOff className="text-gray-400" size={40} />
                  )}
                  <span className="text-gray-400 text-sm">
                    {hasVideoDevice ? "Camera Off" : "No Camera"}
                  </span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-blue-600/90 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 backdrop-blur-sm shadow-sm">
                Bạn (Tôi)
                {showLocalSpeakingIndicator && (
                  <span className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 h-full bg-white animate-pulse"></span>
                    <span className="w-0.5 h-2/3 bg-white animate-pulse delay-75"></span>
                    <span className="w-0.5 h-full bg-white animate-pulse delay-150"></span>
                  </span>
                )}
              </div>

              {isMuted && (
                <div className="absolute top-3 right-3 bg-red-500 p-2 rounded-full shadow-lg">
                  <MicOff size={16} className="text-white" />
                </div>
              )}
            </div>

            {/* REMOTE VIDEO CARDS */}
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <RemoteVideo
                key={userId}
                userInfo={remoteUsersInfo.get(userId) as CurrentUser}
                stream={stream}
                isMuted={mutedUsers.has(userId)}
              />
            ))}
          </div>
        </main>

        {/* FOOTER CONTROLS */}
        <footer className="flex-none h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4 z-20">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
              isMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={toggleVideo}
            disabled={!hasVideoDevice}
            className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
              !hasVideoDevice
                ? "bg-gray-800 opacity-50 cursor-not-allowed"
                : isVideoOff
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isVideoOff || !hasVideoDevice ? (
              <VideoOff size={24} />
            ) : (
              <Video size={24} />
            )}
          </button>

          <button
            onClick={toggleSpeech}
            disabled={isMuted}
            className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
              isMuted
                ? "opacity-50 cursor-not-allowed bg-gray-800"
                : isSpeechEnabled
                ? "bg-blue-600 hover:bg-blue-500 ring-2 ring-blue-400"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title="Bật/Tắt AI của riêng bạn"
          >
            <Captions size={24} />
          </button>

          <button
            onClick={requestAllToTurnOnAI}
            className="p-4 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 transition-all duration-200"
            title="Yêu cầu mọi người cùng bật AI (Meeting Mode)"
          >
            <Sparkles size={24} />
          </button>

          <button
            onClick={handleScreenShare}
            className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
              isScreenSharing
                ? "bg-blue-600 hover:bg-blue-500 ring-2 ring-blue-400 animate-pulse"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
          >
            <MonitorUp size={24} />
          </button>

          <button
            onClick={() => router.push("/")}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 shadow-lg ml-4"
          >
            <PhoneOff size={24} />
          </button>
        </footer>
      </div>

      {/* MODAL AI REQUEST */}
      {showAiRequest && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-blue-600" /> Bật Phụ Đề AI?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Chủ phòng đã kích hoạt tính năng ghi chú cuộc họp.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptAi}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg"
              >
                Đồng ý
              </button>
              <button
                onClick={() => setShowAiRequest(false)}
                className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {kickRequest && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 text-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-600 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <ShieldAlert className="text-yellow-500" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Yêu cầu từ Admin</h3>
                <p className="text-sm text-gray-400">
                  Cần sự chấp thuận của Host
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-xl mb-6 border border-gray-600">
              <p className="text-lg mb-2">
                Admin{" "}
                <span className="font-bold text-blue-400">
                  {kickRequest.requesterName}
                </span>{" "}
                muốn:
              </p>
              <p
                className={`text-xl font-bold flex items-center gap-2 ${
                  kickRequest.type === "kick"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {kickRequest.type === "kick"
                  ? "KICK (Chặn)"
                  : "UNKICK (Gỡ Chặn)"}
              </p>
              <p className="text-white mt-1 text-lg">
                Thành viên:{" "}
                <span className="font-bold">
                  {kickRequest.targetUserName || "User"}
                </span>
              </p>
              <div className="mt-3 text-sm text-gray-400 italic">
                "{kickRequest.message}"
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setKickRequest(null)}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 font-bold transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={20} /> Từ chối
              </button>
              <button
                onClick={handleConfirmKickAction}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-colors flex items-center justify-center gap-2
                            ${
                              kickRequest.type === "kick"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }
                        `}
              >
                <CheckCircle size={20} /> Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
