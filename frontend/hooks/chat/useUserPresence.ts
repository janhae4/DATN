import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export interface UserPresence {
    userId: string;
    isOnline: boolean;
    lastSeen: Date | null;
}

export const useUserPresence = (userId: string | null) => {
    const { chatSocket } = useSocket();
    const [presence, setPresence] = useState<UserPresence | null>(null);

    useEffect(() => {
        if (!chatSocket || !userId) return;

        const checkStatus = () => {
            if (chatSocket.connected) {
                chatSocket.emit('check_user_status', [userId], (response: any[]) => {
                    if (Array.isArray(response) && response.length > 0) {
                        const data = response[0];
                        setPresence({
                            userId: data.userId,
                            isOnline: data.isOnline,
                            lastSeen: data.lastSeen ? new Date(data.lastSeen) : null
                        });
                    }
                });
            }
        };

        checkStatus(); // Initial check

        // Poll every 60 seconds
        const interval = setInterval(checkStatus, 60000);

        const onConnect = () => checkStatus();
        chatSocket.on('connect', onConnect);

        return () => {
            clearInterval(interval);
            chatSocket.off('connect', onConnect);
        };
    }, [chatSocket, userId]);

    return presence;
};
