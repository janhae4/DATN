import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export const useOnlineStatus = (userIds: string[]) => {
    const { chatSocket } = useSocket();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!chatSocket || userIds.length === 0) return;

        const checkStatus = () => {
            if (chatSocket.connected) {
                chatSocket.emit('check_online', userIds, (onlineIds: string[]) => {
                    if (Array.isArray(onlineIds)) {
                        setOnlineUsers(new Set(onlineIds));
                    }
                });
            }
        };

        checkStatus();

        const interval = setInterval(checkStatus, 60000);

        const onConnect = () => checkStatus();
        chatSocket.on('connect', onConnect);

        return () => {
            clearInterval(interval);
            chatSocket.off('connect', onConnect);
        };
    }, [chatSocket, JSON.stringify(userIds)]);

    return onlineUsers;
};
