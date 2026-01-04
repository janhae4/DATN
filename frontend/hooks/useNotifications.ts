import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (err: any) {
            console.error('Failed to fetch notifications', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(`Failed to mark notification ${id} as read`, err);
        }
    };

    const markAsUnread = async (id: string) => {
        try {
            await notificationService.markAsUnread(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
        } catch (err) {
            console.error(`Failed to mark notification ${id} as unread`, err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error(`Failed to delete notification ${id}`, err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Polling every 30 seconds for new notifications
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refetch: fetchNotifications,
        markAllAsRead,
        markAsRead,
        markAsUnread,
        deleteNotification
    };
};
