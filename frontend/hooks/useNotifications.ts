import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const useNotifications = () => {
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { socket, isConnected } = useSocket();

    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setError(null);
        try {
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (err: any) {
            toast.error('Failed to fetch notifications', err);
            if (!isBackground) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch notifications');
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewNotification = (data: any) => {
            console.log("🔔 New notification received:", data);
            toast.info(data.title || "New notification");

            const resourceType = data.resourceType;
            const resourceId = data.resourceId;
            const action = data.metadata?.action;

            if (resourceType === 'TEAM') {

                queryClient.invalidateQueries({
                    queryKey: ['teamMembers', resourceId]
                });

                queryClient.invalidateQueries({
                    queryKey: ['team', resourceId]
                });

                if (action === 'REMOVE_MEMBER_TARGET' || action === 'LEAVE_TEAM') {
                    queryClient.invalidateQueries({
                        queryKey: ['teams']
                    });
                }

                if (action === 'ADD_MEMBER_TARGET') {
                    queryClient.invalidateQueries({ queryKey: ['teams'] });
                }
            }

            fetchNotifications(true);
        };

        socket.on('notification', handleNewNotification);

        return () => {
            socket.off('notification', handleNewNotification);
        };
    }, [socket, isConnected, fetchNotifications]);

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            await notificationService.markAllAsRead();
        } catch (err) {
            toast.error('Failed to mark all as read');
            fetchNotifications(true);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await notificationService.markAsRead(id);
        } catch (err) {
            toast.error(`Failed to mark notification ${id} as read`);
        }
    };

    const markAsUnread = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            await notificationService.markAsUnread(id);
        } catch (err) {
            toast.error(`Failed to mark notification ${id} as unread`);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== id));
            await notificationService.delete(id);
        } catch (err) {
            toast.error(`Failed to delete notification ${id}`);
            fetchNotifications(true);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refetch: () => fetchNotifications(false),
        markAllAsRead,
        markAsRead,
        markAsUnread,
        deleteNotification
    };
};