import { useState } from "react";
import { Spinner } from "./components";
import { ApiService } from "./api-service";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversation: Conversation) => void;
}
export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [teamName, setTeamName] = useState("");
  const [participantIds, setParticipantIds] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamName.trim() || !participantIds.trim()) {
      setError("Vui lòng nhập tên team và ID thành viên.");
      return;
    }
    const ids = participantIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
    if (ids.length === 0) {
      setError("Bạn cần nhập ít nhất một ID thành viên hợp lệ.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const newTeamConversation = await ApiService.createTeam(teamName, ids);
      setTeamName("");
      setParticipantIds("");
      onChatCreated(newTeamConversation);
    } catch (err: any) {
      setError(err.message || "Không thể tạo team.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tạo Team mới</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Tên Team{" "}
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Tên team của bạn..."
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label
              htmlFor="participantIds"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              ID Thành viên (cách nhau bằng dấu phẩy){" "}
            </label>
            <textarea
              id="participantIds"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              placeholder="Nhập User ID, cách nhau bằng dấu phẩy..."
              className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {" "}
              Ví dụ: 60d...1, 60d...2, 60d...3{" "}
            </p>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              {" "}
              Hủy{" "}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            >
              {" "}
              {isLoading ? <Spinner /> : "Tạo Team"}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
