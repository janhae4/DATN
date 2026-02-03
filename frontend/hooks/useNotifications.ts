import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';
import { usePathname, useSearchParams } from 'next/navigation';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();

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
        if (notifications.length === 0 || !pathname) return;

        const channelId = searchParams.get('channelId');

        const unreadInView = notifications.filter(n =>
            !n.isRead &&
            n.resourceType === 'DISCUSSION' &&
            n.resourceId &&
            (pathname.includes(n.resourceId) || (channelId && n.resourceId === channelId))
        );

        if (unreadInView.length > 0) {
            unreadInView.forEach(n => {
                markAsRead(n.id);
            });
        }
    }, [notifications, pathname, searchParams]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewNotification = (data: any) => {
            console.log("🔔 New notification received:", data);

            const currentPath = window.location.pathname;
            const urlSearchParams = new URLSearchParams(window.location.search);
            const channelId = urlSearchParams.get('channelId');

            const isViewingDiscussion = data.resourceType === 'DISCUSSION' &&
                (currentPath.includes(data.resourceId) || (channelId && data.resourceId === channelId));

            if (!isViewingDiscussion) {
                toast.info(data.title || "New notification");
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
            // Optimistic update
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