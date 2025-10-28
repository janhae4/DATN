import { useEffect, useState } from "react";
import { ApiService } from "../../services/api-service";
import { Loader2 } from "lucide-react";
import { Conversation, CreateTeam, User } from "../../types/type";
import { CreateReadStreamOptions } from "fs/promises";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversation: Conversation & CreateReadStreamOptions) => void;
}
export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State cho logic tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State cho người được chọn (chỉ 1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Gọi API (page 1, limit 5)
        const response = await ApiService.findByName(searchQuery, 1, 5);
        // const availableUsers = response.data.filter(u => u.id !== selfId);
        setSearchResults(response.data);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [isOpen, searchQuery]); // Chỉ phụ thuộc vào isOpen và searchQuery

  // Đảm bảo Hook được gọi đúng thứ tự
  if (!isOpen) return null;

  // Cập nhật: Chọn 1 user
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Cập nhật: Bỏ chọn user
  const handleRemoveUser = () => {
    setSelectedUser(null);
  };

  // Cập nhật: Gửi form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("Vui lòng chọn một người để bắt đầu trò chuyện.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      // Gọi API với ID của user đã chọn
      const newConversation = await ApiService.createDirectChat(
        selectedUser.id
      );

      // Reset state và đóng modal
      setSelectedUser(null);
      setSearchQuery("");
      onChatCreated(newConversation as Conversation & CreateTeam);
    } catch (err: any) {
      setError(err.message || "Không thể tạo cuộc trò chuyện.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm reset state khi đóng
  const handleClose = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tạo cuộc trò chuyện mới</h2>
        <form onSubmit={handleSubmit}>
          {/* --- Khu vực tìm kiếm/chọn user --- */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gửi tới:
            </label>

            {selectedUser ? (
              // Hiển thị user đã chọn
              <div className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-full flex items-center justify-between gap-2 text-sm">
                <span>
                  {selectedUser.name} (
                  {selectedUser.providerId || selectedUser.email})
                </span>
                <button
                  type="button"
                  onClick={handleRemoveUser}
                  className="text-indigo-500 hover:text-indigo-700 font-bold"
                >
                  &times;
                </button>
              </div>
            ) : (
              // Hiển thị ô tìm kiếm
              <>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bằng tên, email, username..."
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />

                {/* Kết quả tìm kiếm */}
                {isSearching && (
                  <p className="text-gray-500 text-sm mt-1">Đang tìm...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {user.providerId ? `@${user.providerId}` : user.email}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleClose} // Sử dụng hàm đóng đã reset state
              className="px-4 py-2 rounded text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedUser} // Vô hiệu hóa nếu chưa chọn user
              className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
