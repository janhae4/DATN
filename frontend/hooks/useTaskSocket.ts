import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { SendTaskNotification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useTaskSocket = (teamId: string) => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        console.log('🔄 useTaskSocket checking:', {
            teamId,
            socketExists: !!socket,
            socketConnected: socket?.connected
        });

        if (!teamId || !socket) return;

        const joinRoom = () => {
            console.log(`🔌 [Socket] Connected! Emitting join_room: ${teamId}`);
            socket.emit('join_room', { roomId: teamId });
        };

        if (socket.connected) {
            joinRoom();
        } else {
            console.log('⏳ [Socket] Waiting for connection...');
            socket.on('connect', joinRoom);
        }


        const handleTaskUpdate = (data: SendTaskNotification) => {
            const { action, actor, details } = data;

            if (user?.id === actor.id) return;

            if (user?.id && String(user.id) === String(actor.id)) {
                console.log("🛑 Ignoring socket event from myself");
                return;
            }

            console.log("📡 Socket event received:", data);

            const taskName = details?.taskTitle ? `"${details.taskTitle}"` : 'a task';

            switch (action) {
                case 'APPROVED':
                    toast.success(`${actor.name} approved ${taskName}`);
                    break;
                case 'REJECTED':
                    toast.error(`${actor.name} rejected ${taskName}`);
                    break;
                case 'CREATE':
                    toast.info(`${actor.name} created new task: ${taskName}`);
                    break;
                case 'DELETE':
                    toast.error(`${actor.name} deleted task: ${taskName}`);
                    break;
                default:
                    break;
            }

            console.log("🔄 Socket triggered refetch!");
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const key = query.queryKey as any[];
                    return key[0] === 'tasks' && key[1]?.teamId === teamId;
                }
            });

        };

        socket.on('task_update', handleTaskUpdate);

        return () => {
            socket.emit('leave_room', { roomId: teamId });
            socket.off('task_update', handleTaskUpdate);
        };

    }, [teamId, queryClient, socket, user]);
};