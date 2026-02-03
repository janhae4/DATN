"use client";

import React from "react";
import { useUserProfile } from "@/hooks/useAuth";
import { useDeletedServers, useDiscussionMutations } from "@/hooks/useDiscussion";
import { Icon } from "@iconify-icon/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DeletedServersPage() {
    const { data: user } = useUserProfile();
    const userId = user?.id;
    const { teamId: currentTeamId } = useParams();

    const { data: deletedServers = [], isLoading } = useDeletedServers(userId || "");
    const { restoreServer, permanentDeleteServer } = useDiscussionMutations();

    const handleRestore = async (teamId: string) => {
        try {
            await restoreServer(teamId);
            alert("Server restored successfully!");
        } catch (error) {
            console.error("Failed to restore server:", error);
            alert("Error restoring server.");
        }
    };

    const handlePermanentDelete = async (teamId: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this server? This cannot be undone.")) return;
        try {
            await permanentDeleteServer(teamId);
            alert("Server permanently deleted!");
        } catch (error) {
            console.error("Failed to permanently delete server:", error);
            alert("Error deleting server.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${currentTeamId}/chat`}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <Icon icon="lucide:arrow-left" width="24" height="24" />
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Icon icon="lucide:trash-2" className="text-yellow-500" />
                        Soft Deleted Servers
                    </h1>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center flex-1">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-400">Loading deleted servers...</p>
                </div>
            ) : deletedServers.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <Icon icon="lucide:folder-x" width="64" height="64" className="text-gray-700 mb-4" />
                    <p className="text-xl text-gray-500">No soft-deleted servers found.</p>
                    <Link
                        href={`/${currentTeamId}/chat`}
                        className="mt-4 text-indigo-400 hover:underline"
                    >
                        Return to Chat
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deletedServers.map((server: any) => (
                        <div
                            key={server.id}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {server.avatar ? (
                                        <img src={server.avatar} alt={server.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-gray-400">
                                            {server.name?.substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-xl font-semibold truncate" title={server.name}>
                                        {server.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate mt-1">ID: {server.id}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto">
                                <button
                                    onClick={() => handleRestore(server.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                >
                                    <Icon icon="lucide:rotate-ccw" width="18" height="18" />
                                    Restore
                                </button>
                                <button
                                    onClick={() => handlePermanentDelete(server.id)}
                                    className="flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-600 text-red-500 hover:text-white py-2 px-4 rounded-lg font-medium transition-all"
                                    title="Permanent Delete"
                                >
                                    <Icon icon="lucide:trash-2" width="18" height="18" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
