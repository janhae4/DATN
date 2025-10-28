import { Loader2 } from "lucide-react";
import { ApiService } from "../../services/api-service";
import { useEffect, useState } from "react";
import { Conversation, CreateTeam } from "../../types/type";


interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversation: Conversation & CreateTeam) => void;
}
export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [partnerId, setPartnerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPartnerId("");
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!partnerId.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const newConversation = await ApiService.createDirectChat(partnerId);
      onChatCreated(newConversation as Conversation & CreateTeam);
    } catch (err: any) {
      setError(err.message || "Không thể tạo cuộc trò chuyện.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tạo cuộc trò chuyện mới</h2>
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-2">
            {" "}
            Nhập ID của người bạn muốn trò chuyện.{" "}
          </p>
          <input
            type="text"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder="User ID"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
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
                "Tạo"
              )}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
