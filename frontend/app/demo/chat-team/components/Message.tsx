import { Bot, Loader2, Info } from "lucide-react";
import Markdown from "react-markdown";
import { MessageData } from "../types/type";

interface MessageProps {
  message: MessageData;
  isCurrentUser: boolean;
  isStreaming?: boolean;
}

export const Message: React.FC<MessageProps> = ({
  message,
  isCurrentUser,
  isStreaming,
}) => {
  if (message.sender?._id === "SYSTEM_ID") {
    return (
      <div className="flex justify-center items-center my-3 w-full">
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
          <Info size={14} className="flex-shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  if (isStreaming) {
    return (
      <div className="flex items-start gap-4 my-4">
        <div className="w-10 h-10 bg-indigo-600 p-2.5 rounded-full text-white flex-shrink-0 flex items-center justify-center">
          <Bot size={20} />
        </div>
        <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none p-3 max-w-lg shadow-sm">
          <Loader2 className="animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  return (
    <div
      key={message._id}
      className={`flex items-start gap-3 my-4 ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isCurrentUser &&
        (message.sender._id === "AI_SYSTEM_ID" ? (
          <div className="w-10 h-10 bg-indigo-600 p-2.5 rounded-full text-white flex-shrink-0 flex items-center justify-center">
            <Bot size={20} />
          </div>
        ) : (
          <img
            src={
              message.sender.avatar ||
              `https://i.pravatar.cc/150?u=${message.sender._id}`
            }
            alt={message.sender.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ))}

      <div
        className={`flex flex-col ${
          isCurrentUser ? "items-end" : "items-start"
        }`}
      >
        {!isCurrentUser && (
          <p className="text-xs text-gray-500 mb-1">{message.sender.name}</p>
        )}
        <div
          className={`px-4 py-2 rounded-2xl max-w-md md:max-w-lg shadow-sm ${
            isCurrentUser
              ? "bg-indigo-500 text-white rounded-br-none"
              : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
          }`}
        >
          <Markdown>{message.content}</Markdown>
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
};
