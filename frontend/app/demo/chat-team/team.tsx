import {
  CrownIcon,
  Loader2,
  LogOutIcon,
  MoreVerticalIcon,
  ShieldIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApiService } from "./api-service";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversation: Conversation) => void;
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
      onChatCreated(newConversation);
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

  useEffect(() => {
    if (!isOpen) {
      setTeamName("");
      setParticipantIds("");
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);

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
              htmlFor="participantIdsTeam"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              ID Thành viên (cách nhau bằng dấu phẩy){" "}
            </label>
            <textarea
              id="participantIdsTeam"
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
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                "Tạo Team"
              )}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Role Icon ---
export const RoleIcon: React.FC<{ role?: UserRole }> = ({ role }) => {
  if (role === "OWNER")
    return (
      <div className="flex justify-center items-center gap-2">
        <CrownIcon className="w-5 h-5 text-yellow-500" />
        <p className="text-xs text-gray-500">Chủ sở hữu</p>
      </div>
    );
  if (role === "ADMIN")
    return (
      <div className="flex justify-center items-center gap-2">
        <UserPlusIcon className="w-5 h-5 text-green-500" />
        <p className="text-xs text-gray-500">Quản lý</p>
      </div>
    );

  return null;
};

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMembersAdded: (updatedConversation: Conversation) => void;
  conversationId: string;
}
export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMembersAdded,
  conversationId,
}) => {
  const [participantIds, setParticipantIds] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setParticipantIds("");
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ids = participantIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
    if (ids.length === 0) {
      setError("Vui lòng nhập ít nhất một User ID.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const updatedConversation = await ApiService.addMembers(
        conversationId,
        ids
      );
      onMembersAdded(updatedConversation);
    } catch (err: any) {
      setError(err.message || "Không thể thêm thành viên.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Thêm thành viên mới</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="participantIdsAdd"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              User IDs (cách nhau bằng dấu phẩy){" "}
            </label>
            <textarea
              id="participantIdsAdd"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              placeholder="Nhập User ID..."
              className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
              required
            />
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
                "Thêm"
              )}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Change Role Modal ---
interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged: (updatedConversation: Conversation) => void;
  conversationId: string;
  member: Participant;
}
export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged,
  conversationId,
  member,
}) => {
  const [newRole, setNewRole] = useState<UserRole>(member.role || "MEMBER");
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
        member._id,
        newRole
      );
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
          Đổi vai trò cho {member.name}
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
              onChange={(e) => setNewRole(e.target.value as UserRole)}
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

// --- Confirmation Modal ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
  confirmColorClass?: string;
}
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColorClass = "bg-red-600 hover:bg-red-700",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsLoading(false);
  }, [isOpen]);
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose(); // Đóng modal sau khi confirm thành công
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`); // Nên thay bằng toast
      setIsLoading(false); // Dừng loading nếu lỗi
    }
    // finally không cần setIsLoading(false) vì đã có trong try/catch
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            {" "}
            Hủy{" "}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded text-white ${confirmColorClass} disabled:bg-gray-300 flex items-center`}
          >
            {" "}
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              confirmText
            )}{" "}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Manage Members Modal ---
interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUser: User;
  onConversationUpdated: (updatedConversation: Conversation) => void;
  onUserLeave: () => void;
}
export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onConversationUpdated,
  onUserLeave,
}) => {
  const [optionsForMember, setOptionsForMember] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    "add" | "kick" | "role" | "transfer" | "leave" | null
  >(null);
  const [selectedMember, setSelectedMember] = useState<Participant | null>(
    null
  );
  const optionsRef = useRef<HTMLDivElement>(null);

  // Đóng menu options khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setOptionsForMember(null);
      }
    };
    if (optionsForMember) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsForMember]);

  // Reset state khi modal chính đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setOptionsForMember(null);
      setModalState(null);
      setSelectedMember(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const participants = conversation.participants || [];
  const currentUserParticipant = participants.find(
    (p) => p._id === currentUser.id
  );
  const currentUserRole = currentUserParticipant?.role;

  const canAddMembers =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canLeave = currentUserRole !== "OWNER";

  const canManageMember = (
    member: Participant
  ): { canKick: boolean; canChangeRole: boolean; canTransfer: boolean } => {
    if (member._id === currentUser.id)
      return { canKick: false, canChangeRole: false, canTransfer: false }; // Không tự quản lý mình
    if (currentUserRole === "OWNER")
      return { canKick: true, canChangeRole: true, canTransfer: true };
    if (currentUserRole === "ADMIN") {
      const canManage = member.role === "MEMBER";
      return {
        canKick: canManage,
        canChangeRole: canManage,
        canTransfer: false,
      };
    }
    return { canKick: false, canChangeRole: false, canTransfer: false };
  };

  const handleOpenOptions = (e: React.MouseEvent, member: Participant) => {
    e.stopPropagation();
    setOptionsForMember(optionsForMember === member._id ? null : member._id);
  };
  const handleAction = (
    action: "kick" | "role" | "transfer",
    member: Participant
  ) => {
    setSelectedMember(member);
    setModalState(action);
    setOptionsForMember(null);
  };
  const onModalClose = () => {
    setModalState(null);
    setSelectedMember(null);
  };
  const onConfirmAndUpdate = (updatedConversation: Conversation) => {
    onConversationUpdated(updatedConversation);
    onModalClose();
  };

  const handleKick = async () => {
    if (!selectedMember) return;
    const updated = await ApiService.removeMember(
      conversation._id,
      selectedMember._id
    );
    onConversationUpdated(updated);
  };
  const handleTransfer = async () => {
    if (!selectedMember) return;
    const updated = await ApiService.transferOwnership(
      conversation._id,
      selectedMember._id
    );
    onConversationUpdated(updated);
  };
  const handleLeave = async () => {
    await ApiService.leaveConversation(conversation._id);
    onUserLeave();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {conversation.name} - Thành viên
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              {" "}
              <XIcon className="w-6 h-6" />{" "}
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {" "}
            {/* Thêm padding right để scroll bar ko che nút */}
            {participants.map((member) => {
              const permissions = canManageMember(member);
              const isCurrentUser = member._id === currentUser.id;
              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        member.avatar ||
                        `https://i.pravatar.cc/150?u=${member._id}`
                      }
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src = `https://placehold.co/100x100/cccccc/ffffff?text=?`)
                      }
                    />
                    <div>
                      <p className="font-semibold">
                        {member.name} {isCurrentUser && "(Bạn)"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.role || "MEMBER"}
                      </p>{" "}
                      {/* Hiển thị MEMBER nếu role null */}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleIcon role={member.role} />
                    {!isCurrentUser &&
                      (permissions.canKick ||
                        permissions.canChangeRole ||
                        permissions.canTransfer) && (
                        <div className="relative">
                          <button
                            onClick={(e) => handleOpenOptions(e, member)}
                            className="p-2 rounded-full hover:bg-gray-200"
                          >
                            <MoreVerticalIcon className="w-5 h-5" />
                          </button>
                          {optionsForMember === member._id && (
                            <div
                              ref={optionsRef}
                              className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg z-10 py-1"
                            >
                              {permissions.canChangeRole && (
                                <button
                                  onClick={() => handleAction("role", member)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {" "}
                                  Đổi vai trò{" "}
                                </button>
                              )}
                              {permissions.canTransfer && (
                                <button
                                  onClick={() =>
                                    handleAction("transfer", member)
                                  }
                                  className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                                >
                                  {" "}
                                  Chuyển quyền sở hữu{" "}
                                </button>
                              )}
                              {permissions.canKick && (
                                <button
                                  onClick={() => handleAction("kick", member)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                  {" "}
                                  Xóa khỏi nhóm{" "}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t space-y-2">
            {canAddMembers && (
              <button
                onClick={() => setModalState("add")}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                {" "}
                <UserPlusIcon className="w-5 h-5" /> Thêm thành viên{" "}
              </button>
            )}
            {canLeave && (
              <button
                onClick={() => setModalState("leave")}
                className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg"
              >
                {" "}
                <LogOutIcon className="w-5 h-5" /> Rời khỏi nhóm{" "}
              </button>
            )}
            {!canLeave && (
              <p className="text-sm text-gray-500 text-center">
                {" "}
                Bạn phải chuyển quyền sở hữu cho người khác trước khi rời nhóm.{" "}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Render các modal con */}
      <AddMemberModal
        isOpen={modalState === "add"}
        onClose={onModalClose}
        conversationId={conversation._id}
        onMembersAdded={onConfirmAndUpdate}
      />
      {selectedMember && (
        <ChangeRoleModal
          isOpen={modalState === "role"}
          onClose={onModalClose}
          conversationId={conversation._id}
          member={selectedMember}
          onRoleChanged={onConfirmAndUpdate}
        />
      )}
      {selectedMember && (
        <ConfirmationModal
          isOpen={modalState === "kick"}
          onClose={onModalClose}
          title={`Xóa ${selectedMember.name}?`}
          message={`Bạn có chắc muốn xóa ${selectedMember.name} khỏi nhóm?`}
          confirmText="Xóa"
          onConfirm={handleKick}
        />
      )}
      {selectedMember && (
        <ConfirmationModal
          isOpen={modalState === "transfer"}
          onClose={onModalClose}
          title={`Chuyển quyền sở hữu?`}
          message={`Bạn có chắc muốn chuyển quyền sở hữu cho ${selectedMember.name}? Bạn sẽ trở thành Quản trị viên (Admin).`}
          confirmText="Chuyển quyền"
          confirmColorClass="bg-yellow-600 hover:bg-yellow-700"
          onConfirm={handleTransfer}
        />
      )}
      <ConfirmationModal
        isOpen={modalState === "leave"}
        onClose={onModalClose}
        title="Rời khỏi nhóm?"
        message="Bạn có chắc chắn muốn rời khỏi nhóm này? Bạn sẽ không thể tham gia lại trừ khi được thêm vào."
        confirmText="Rời khỏi"
        onConfirm={handleLeave}
      />
    </>
  );
};
