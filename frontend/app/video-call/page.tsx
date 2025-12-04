"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Users,
  Loader2,
  Briefcase,
  FileText,
  Calendar,
} from "lucide-react";
import { CurrentUser } from "../demo/chat-team/types/type";
import { ApiService } from "../demo/chat-team/services/api-service";
import { LoginPage } from "../demo/chat-team/login";

export enum RefType {
  TEAM = "TEAM",
  TASK = "TASK",
  DOC = "DOC",
  PROJECT = "PROJECT",
  // CALENDAR = "CALENDAR",
}

function CreateVideoCallPage() {
  const [teamId, setTeamId] = useState("4816f5d1-5e0e-481e-8939-7a871d1cea04");
  const [refType, setRefType] = useState<RefType>(RefType.TEAM);
  const [refId, setRefId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (refType === RefType.TEAM) {
      setRefId(teamId);
    }
  }, [refType, teamId]);

  const handleStartMeeting = async () => {
    if (!teamId) {
      alert("Vui lòng nhập Team ID");
      return;
    }

    if (refType !== RefType.TEAM && !refId) {
      alert(`Vui lòng nhập ID cho ${refType}`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await ApiService.joinVideoCall(teamId, refId, refType);

      if (result && result.roomId) {
        router.push(`/video-call/${result.roomId}?teamId=${teamId}`);
      }
    } catch (error) {
      console.error("Failed to start meeting", error);
      alert("Không thể bắt đầu cuộc họp. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <Video size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Bắt đầu họp</h1>
          <p className="text-gray-500 mt-2 text-center text-sm">
            Hệ thống sẽ tự động kết nối bạn vào phòng họp của Team hoặc Task
            tương ứng.
          </p>
        </div>

        <div className="space-y-4">
          {/* TEAM ID INPUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team ID
            </label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="UUID của Team"
            />
          </div>

          {/* REF TYPE SELECT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại cuộc họp (Context)
            </label>
            <div className="relative">
              <select
                value={refType}
                onChange={(e) => setRefType(e.target.value as RefType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
              >
                <option value={RefType.TEAM}>Họp chung Team</option>
                <option value={RefType.TASK}>Thảo luận Task</option>
                <option value={RefType.DOC}>Thảo luận Tài liệu</option>
                <option value={RefType.PROJECT}>Họp Dự án</option>
              </select>
              <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                <Briefcase size={16} />
              </div>
            </div>
          </div>

          {/* REF ID INPUT (Chỉ hiện khi không phải họp Team chung) */}
          {refType !== RefType.TEAM && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {refType === RefType.TASK
                  ? "Task ID"
                  : refType === RefType.DOC
                  ? "Document ID"
                  : "Reference ID"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                  placeholder={`Nhập ID của ${refType.toLowerCase()}...`}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  {refType === RefType.TASK ? (
                    <Calendar size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="mt-6">
            <button
              onClick={handleStartMeeting}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Video size={20} />
              )}
              {isLoading ? "Đang kết nối..." : "Tham gia / Tạo phòng"}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              *Nếu phòng đã tồn tại, bạn sẽ được đưa vào ngay lập tức.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Page() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      setIsAuthenticating(true);
      try {
        const userInfo = await ApiService.getInfo();
        if (!userInfo) {
          setCurrentUser(null);
        } else {
          setCurrentUser(userInfo);
        }
      } catch (error) {
        console.error("Verification failed:", error);
        setCurrentUser(null);
      } finally {
        setIsAuthenticating(false);
      }
    };
    verifyUser();
  }, []);

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />   
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return <CreateVideoCallPage />;
}
