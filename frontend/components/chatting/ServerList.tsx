import React from "react";
import Link from "next/link";
import { Icon } from "@iconify-icon/react";

interface ServerListProps {
    servers: any[];
    selectedServerId: string | null;
    loadingServers: boolean;
    isCreatingServer: boolean;
    onSelectServer: (id: string) => void;
    onJoinServer: () => void;
    onCreateServer: () => void;
    teamId: string;
}

export const ServerList: React.FC<ServerListProps> = ({
    servers,
    selectedServerId,
    loadingServers,
    isCreatingServer,
    onSelectServer,
    onJoinServer,
    onCreateServer,
    teamId
}) => {
    return (
        <div className="w-20 flex flex-col items-center py-4 bg-gray-950 space-y-4 border-r border-gray-800">
            {loadingServers && <div className="text-xs">Loading...</div>}

            {servers.map((server: any) => (
                <button
                    key={server.id}
                    onClick={() => onSelectServer(server.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-indigo-500 font-bold overflow-hidden ${selectedServerId === server.id ? "bg-indigo-600 rounded-2xl" : "bg-gray-700"
                        }`}
                    title={server.name}
                >
                    {server.avatar ? (
                        <img src={server.avatar} alt={server.name || "Server"} className="w-full h-full object-cover" />
                    ) : (
                        (server.name || "??").substring(0, 2).toUpperCase()
                    )}
                </button>
            ))}

            {/* Join Server Button */}
            <button
                onClick={onJoinServer}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all"
                title="Join Server"
            >
                <Icon icon="lucide:user-plus" width="20" height="20" />
            </button>

            {/* Add Server Button */}
            <button
                onClick={onCreateServer}
                disabled={isCreatingServer}
                className={`w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-all ${isCreatingServer ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                {isCreatingServer ? <Icon icon="lucide:loader-2" className="animate-spin" /> : "+"}
            </button>

            {/* Trash Page Link */}
            <div className="mt-auto pb-4">
                <Link
                    href={`/${teamId}/chat/trash`}
                    className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-yellow-500 flex items-center justify-center transition-all"
                    title="Soft Deleted Servers"
                >
                    <Icon icon="lucide:trash-2" width="20" height="20" />
                </Link>
            </div>
        </div>
    );
};
