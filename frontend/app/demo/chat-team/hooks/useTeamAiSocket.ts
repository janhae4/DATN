import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const NESTJS_GATEWAY_URL = "http://localhost:4001";

export function useTeamKnowledgeSocket(teamId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(NESTJS_GATEWAY_URL, { withCredentials: true });
        setSocket(newSocket);

        newSocket.on("connect", () => console.log("✅ AI Socket connected.", newSocket.id));

        // (Tùy chọn) Gửi teamId lên server để join room nếu cần
        // newSocket.emit('join_team_ai_room', { teamId });

        return () => {
            newSocket.disconnect();
            console.log("⚠️ AI Socket disconnected.");
        };
    }, [teamId]); // Sẽ kết nối lại nếu teamId thay đổi

    return socket;
}