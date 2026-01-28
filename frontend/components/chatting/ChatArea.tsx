import React, { useRef, useEffect } from "react";
import { Icon } from "@iconify-icon/react";

interface ChatAreaProps {
    selectedChannelId: string | null;
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
    messages: any[];
    typingUsers: { userId: string; name: string; avatar?: string }[];
    inputMsg: string;
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    onSendMessage: (e: React.FormEvent) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isVoice: boolean;
    user: any;
    userId?: string;
    voiceParticipants: any[];
    remoteStreams: Map<string, MediaStream>;
    onLeaveVoice: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    selectedChannelId,
    selectedChannelName,
    showMembers,
    onToggleMembers,
    messages,
    typingUsers,
    inputMsg,
    hasNextPage,
    onFetchNextPage,
    onSendMessage,
    onInputChange,
    isVoice,
    user,
    userId,
    voiceParticipants,
    remoteStreams,
    onLeaveVoice
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!selectedChannelId) {
        return (
            <div className="flex-1 flex flex-col bg-gray-800 relative">
                <div className="flex items-center justify-center h-full text-gray-500">
                    Select a channel to start chatting
                </div>
            </div>
        );
    }

    if (isVoice) {
        return (
            <div className="flex-1 flex flex-col bg-gray-800 relative">
                <div className="h-12 border-b border-gray-700 flex items-center px-4 font-bold shadow-sm bg-gray-800 z-10">
                    <span className="text-gray-400 mr-2">#</span>
                    {selectedChannelName}
                    <div className="ml-auto flex items-center space-x-2">
                        <button
                            onClick={onToggleMembers}
                            className={`p-1 rounded transition-colors ${showMembers ? "text-indigo-400" : "text-gray-400 hover:text-gray-200"
                                }`}
                            title="Toggle Member List"
                        >
                            <Icon icon="lucide:users" width="20" height="20" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    </div>

                    <div className="z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                        {/* Current User Card */}
                        <div className="aspect-video bg-gray-800/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-gray-700 shadow-xl relative group overflow-hidden">
                            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 ring-4 ring-indigo-500/30">
                                {user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.name?.[0]?.toUpperCase() || "U"
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-200">{user?.name || "You"}</h3>
                            <div className="absolute bottom-3 right-3 bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs border border-indigo-500/30 flex items-center gap-1">
                                <Icon icon="lucide:mic" width="12" />
                                <span>Speaking</span>
                            </div>
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>

                        {/* Remote Participants */}
                        {voiceParticipants
                            .filter((p) => p.userInfo?.id !== userId)
                            .map((p) => (
                                <div
                                    key={p.userInfo?.id || Math.random()}
                                    className="aspect-video bg-gray-800/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-gray-700 shadow-xl relative group overflow-hidden"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2 overflow-hidden ring-2 ring-gray-600">
                                        {p.userInfo?.avatar ? (
                                            <img src={p.userInfo.avatar} alt={p.userInfo.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold">{p.userInfo?.name?.[0]?.toUpperCase() || "?"}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-200">{p.userInfo?.name || "Unknown"}</span>
                                </div>
                            ))}

                        {voiceParticipants.filter(p => p.userInfo?.id !== userId).length === 0 && (
                            <div className="aspect-video bg-gray-800/30 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-700 text-gray-500 hover:border-gray-600 hover:bg-gray-800/50 transition-all cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                    <Icon icon="lucide:user-plus" width="24" className="opacity-50" />
                                </div>
                                <span className="text-sm font-medium">Waiting for others...</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-gray-700/50 z-20">
                        <button className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all transform hover:scale-110 active:scale-95 group relative" title="Mute">
                            <Icon icon="lucide:mic" width="24" />
                        </button>
                        <button className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all transform hover:scale-110 active:scale-95 group relative" title="Turn on Camera">
                            <Icon icon="lucide:video-off" width="24" className="text-gray-400" />
                        </button>
                        <button className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all transform hover:scale-110 active:scale-95 group relative" title="Share Screen">
                            <Icon icon="lucide:monitor-up" width="24" />
                        </button>
                        <div className="w-px h-8 bg-gray-700 mx-2" />
                        <button
                            onClick={onLeaveVoice}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-red-600/30 px-6 flex items-center gap-2"
                        >
                            <Icon icon="lucide:phone-off" width="24" />
                            <span className="font-bold">Leave</span>
                        </button>
                    </div>

                    {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
                        <audio
                            key={socketId}
                            ref={(audio) => {
                                if (audio) {
                                    audio.srcObject = stream;
                                    audio.play().catch(e => console.error("Error playing audio:", e));
                                }
                            }}
                            autoPlay
                            playsInline
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-800 relative">
            <div className="h-12 border-b border-gray-700 flex items-center px-4 font-bold shadow-sm bg-gray-800 z-10">
                <span className="text-gray-400 mr-2">#</span>
                {selectedChannelName}
                <div className="ml-auto flex items-center space-x-2">
                    <button
                        onClick={onToggleMembers}
                        className={`p-1 rounded transition-colors ${showMembers ? "text-indigo-400" : "text-gray-400 hover:text-gray-200"
                            }`}
                        title="Toggle Member List"
                    >
                        <Icon icon="lucide:users" width="20" height="20" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
                <div ref={messagesEndRef} />

                {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-400 animate-pulse pb-2">
                        <div className="flex -space-x-1">
                            {typingUsers.slice(0, 3).map((u) => (
                                <div key={u.userId} className="w-4 h-4 rounded-full bg-gray-600 border border-gray-800 flex items-center justify-center overflow-hidden">
                                    {u.avatar ? <img src={u.avatar} alt={u.name} /> : <span>{u.name?.[0]}</span>}
                                </div>
                            ))}
                        </div>
                        <span>{typingUsers.length} typing...</span>
                    </div>
                )}

                {messages.length === 0 && !typingUsers.length && (
                    <div className="text-gray-500 mt-10">Chưa có tin nhắn nào.</div>
                )}

                {messages.filter(msg => msg?._id).map((msg: any) => (
                    <div
                        key={msg._id}
                        className="flex items-start space-x-3 group hover:bg-gray-700/30 p-1 rounded -ml-1"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex-shrink-0 overflow-hidden">
                            {msg.sender?.avatar ? (
                                <img src={msg.sender.avatar} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {msg.sender?.name?.[0]}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-baseline space-x-2">
                                <span className="font-medium text-indigo-300">
                                    {msg.sender?.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-gray-100 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {hasNextPage && (
                    <button
                        onClick={onFetchNextPage}
                        className="text-xs text-blue-400 self-center"
                    >
                        Load older messages
                    </button>
                )}
            </div>

            <div className="p-4 bg-gray-800">
                <form
                    onSubmit={onSendMessage}
                    className="bg-gray-700 rounded-lg p-2 flex items-center space-x-2"
                >
                    <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-gray-600 text-gray-300 hover:bg-gray-500 flex items-center justify-center"
                    >
                        +
                    </button>
                    <input
                        type="text"
                        value={inputMsg}
                        onChange={onInputChange}
                        placeholder={`Message #${selectedChannelName || "channel"}`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-400"
                    />
                </form>
            </div>
        </div>
    );
};
