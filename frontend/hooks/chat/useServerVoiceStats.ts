import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export const useServerVoiceStats = (selectedServerId: string | null) => {
    const { voiceSocket } = useSocket();
    const [voiceParticipants, setVoiceParticipants] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (!voiceSocket || !selectedServerId) {
            setVoiceParticipants({});
            return;
        }

        voiceSocket.emit('join_server_events', { teamId: selectedServerId });

        voiceSocket.emit('get_server_voice_state', { teamId: selectedServerId }, (initialStates: any[]) => {
            const map: Record<string, any[]> = {};
            if (Array.isArray(initialStates)) {
                initialStates.forEach(state => {
                    if (!map[state.roomId]) map[state.roomId] = [];
                    // Avoid duplicates
                    if (!map[state.roomId].find((p: any) => p.userInfo.id === state.userId)) {
                        map[state.roomId].push({ userInfo: state.userInfo, socketId: state.socketId });
                    }
                });
            }
            setVoiceParticipants(map);
        });

        // 3. Listen for updates
        const handleVoiceStateUpdate = (data: { userId: string, roomId: string, type: 'JOIN' | 'LEAVE', userInfo: any }) => {
            setVoiceParticipants(prev => {
                const newMap = { ...prev };
                const roomParticipants = newMap[data.roomId] || [];

                if (data.type === 'JOIN') {
                    // Check if already exists
                    if (!roomParticipants.find(p => p.userInfo?.id === data.userId)) {
                        newMap[data.roomId] = [...roomParticipants, { userInfo: data.userInfo }];
                    }
                } else if (data.type === 'LEAVE') {
                    newMap[data.roomId] = roomParticipants.filter(p => p.userInfo?.id !== data.userId);
                }
                return newMap;
            });
        };

        voiceSocket.on('voice_state_update', handleVoiceStateUpdate);

        return () => {
            voiceSocket.off('voice_state_update', handleVoiceStateUpdate);
        };

    }, [voiceSocket, selectedServerId]);

    return { globalVoiceParticipants: voiceParticipants };
};
