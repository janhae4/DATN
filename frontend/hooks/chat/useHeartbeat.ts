import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export const useHeartbeat = () => {
    const { chatSocket } = useSocket();

    useEffect(() => {
        if (!chatSocket) return;

        const sendHeartbeat = () => {
            if (chatSocket.connected) {
                chatSocket.emit('heartbeat');
            }
        };

        sendHeartbeat();

        const interval = setInterval(sendHeartbeat, 30000); 

        const onConnect = () => {
            sendHeartbeat();
        };

        chatSocket.on('connect', onConnect);

        return () => {
            clearInterval(interval);
            chatSocket.off('connect', onConnect);
        };
    }, [chatSocket]);
};
