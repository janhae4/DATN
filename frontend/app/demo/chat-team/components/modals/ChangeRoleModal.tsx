import { Loader2 } from "lucide-react";
import { ApiService } from "../../services/api-service";
import { useEffect, useState } from "react";
import { Conversation, Participant, ParticipantTeam, Team, TeamRole, UserRole } from "../../types/type";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged: (updatedConversation: Team) => void;
  conversationId: string;
  member: ParticipantTeam;
}
export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged,
  conversationId,
  member,
}) => {
  const [newRole, setNewRole] = useState<TeamRole>(member.role || "MEMBER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) setNewRole(member.role || "MEMBER");
    else {
      setError("");
      setIsLoading(false);
    }
  }, [isOpen, member.role]);
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newRole === member.role) {
      onClose();
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const updatedConversation = await ApiService.changeMemberRole(
        conversationId,
        member.userId,
        newRole
      );
      console.log("Updated conversation:", updatedConversation);
      onRoleChanged(updatedConversation);
    } catch (err: any) {
      setError(err.message || "Không thể thay đổi vai trò.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Đổi vai trò cho {member.cachedUser.name}
        </h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="roleSelect"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Vai trò mới{" "}
            </label>
            <select
              id="roleSelect"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as TeamRole)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="ADMIN">Quản trị viên (Admin)</option>
              <option value="MEMBER">Thành viên (Member)</option>
            </select>
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
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                "Lưu"
              )}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
