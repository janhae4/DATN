import { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { ApiService } from "../../services/api-service";
import { Loader2 } from "lucide-react";
interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (team: CreateTeam & Conversation) => void;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { ensureConversationVisible } = useChatStore();

  useEffect(() => {
    console.log(isOpen, searchQuery);
    if (!isOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await ApiService.findByName(searchQuery, 1, 5);
        console.log(response);
        const availableUsers = response.data.filter(
          (user) => !selectedUsers.find((su) => su.id === user.id)
        );
        setSearchResults(availableUsers);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedUsers]);

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };
  if (!isOpen) return null;

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ids = selectedUsers.map((u) => u.id);

    if (!teamName.trim() || ids.length === 0) {
      setError("Vui lòng nhập tên team và chọn ít nhất một thành viên.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const newTeamData = await ApiService.createTeam(teamName, ids);
      console.log(newTeamData);
      const newConversationObject: Conversation & CreateTeam = {
        ...newTeamData,
        _id: newTeamData._id,
        id: newTeamData.id,
        isGroupChat: true,
        name: newTeamData.name,
      };
      await ensureConversationVisible(
        newTeamData.id,
        ApiService.getConversationByTeamId
      );
      setTeamName("");
      setSelectedUsers([]);
      setSearchQuery("");
      onChatCreated(newConversationObject);
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
              Tên Team  
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
                    {/* Khu vực chọn thành viên */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                 Thêm Thành viên  
            </label>
            {/* Hiển thị các user đã chọn */} 
            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded min-h-[40px] mb-2">
                 
              {selectedUsers.length === 0 && (
                <span className="text-gray-400 text-sm p-1">
                      Mời thành viên...      
                </span>
              )}
                 
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                      <span>{user.name}</span>       
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-indigo-500 hover:text-indigo-700 font-bold"
                  >
                          &times;        
                  </button>
                       
                </div>
              ))}
               
            </div>
                        {/* Ô tìm kiếm */}
             
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bằng tên, email, username..."
              className="w-full p-2 border border-gray-300 rounded"
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
          </div>
                   
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}       
            {/* Nút Bấm */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                onClose();
                setTeamName("");
                setSelectedUsers([]);
                setSearchQuery("");
                setError("");
              }}
              className="px-4 py-2 rounded text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              Hủy  
            </button>{" "}
             
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Tạo Team"} 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
