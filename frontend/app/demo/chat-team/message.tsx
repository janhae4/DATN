import { useState } from "react";
import { Spinner } from "./components";
import { ApiService } from "./api-service";

interface MessageProps {
    message: MessageData;
    isCurrentUser: boolean;
}
export const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => (
    <div
        key={message._id}
        className={`flex items-start gap-3 my-4 ${isCurrentUser ? "justify-end" : "justify-start"
            }`}
    >
        {!isCurrentUser && (
            <img
                src={
                    message.sender.avatar ||
                    `https://i.pravatar.cc/150?u=${message.sender._id}`
                }
                alt={message.sender.name}
                className="w-10 h-10 rounded-full object-cover"
            />
        )}
        <div
            className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
        >
            {!isCurrentUser && (
                <p className="text-xs text-gray-500 mb-1">{message.sender.name}</p>
            )}
            <div
                className={`px-4 py-2 rounded-2xl max-w-md md:max-w-lg shadow-sm ${isCurrentUser
                        ? "bg-indigo-500 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                    }`}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">
                {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </p>
        </div>
        {isCurrentUser && (
            <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-10 h-10 rounded-full object-cover"
            />
        )}
    </div>
);

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!partnerId.trim()) return;
        setIsLoading(true);
        setError("");
        try {
            const newConversation = await ApiService.createDirectChat(partnerId);
            onChatCreated(newConversation);
            setPartnerId("");
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
                            {isLoading ? <Spinner /> : "Tạo"}{" "}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
