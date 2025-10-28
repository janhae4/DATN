import {
  DoorOpenIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { AddMemberModal } from "./AddMemberModal";
import { ChangeRoleModal } from "./ChangeRoleModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { RoleIcon } from "../RoleIcon";
import { ApiService } from "../../services/api-service";
import { useEffect, useRef, useState } from "react";

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
    "add" | "kick" | "role" | "transfer" | "leave" | "delete" | null
  >(null);
  const [selectedMember, setSelectedMember] = useState<Participant | null>(
    null
  );
  const optionsRef = useRef<HTMLDivElement>(null);

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

  const canDelete = currentUserRole === "OWNER";

  const canManageMember = (
    member: Participant
  ): { canKick: boolean; canChangeRole: boolean; canTransfer: boolean } => {
    if (member._id === currentUser.id)
      return { canKick: false, canChangeRole: false, canTransfer: false };
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
    console.log(selectedMember);
    const updated = await ApiService.removeMember(
      conversation.teamId || "",
      selectedMember._id
    );
    onConversationUpdated(updated);
  };
  const handleTransfer = async () => {
    if (!selectedMember) return;
    const updated = await ApiService.transferOwnership(
      conversation.teamId || "",
      selectedMember._id
    );
    onConversationUpdated(updated);
  };
  const handleLeave = async () => {
    await ApiService.leaveConversation(conversation.teamId || "");
    onUserLeave();
  };

  const handleDelete = async () => {
    await ApiService.deleteTeam(conversation.teamId || "");
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
                                  Xóa khỏi nhóm
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
            {canDelete && (
              <button
                onClick={() => setModalState("delete")}
                className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg"
              >
                <DoorOpenIcon className="w-5 h-5" /> Xóa nhóm
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
        teamId={conversation.teamId || ""}
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
      {canDelete && (
        <ConfirmationModal
          isOpen={modalState === "delete"}
          onClose={onModalClose}
          title="Xóa nhóm?"
          message="Bạn có chắn chắn xóa nhóm không"
          confirmText="Xóa"
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};
