import { useState, useEffect, useCallback } from 'react';
import { gmailService, GmailMessage } from '../services/gmailService';

export const useGmail = (initialMaxResults = 20) => {
    const [emails, setEmails] = useState<GmailMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await gmailService.getMailList({ maxResults: initialMaxResults });
            setEmails(data.emails || []);
            setNextPageToken(data.nextPageToken || null);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch emails';
            const statusCode = err.response?.status;

            const isAuthIssue =
                statusCode === 401 ||
                statusCode === 403 ||
                statusCode === 500 ||
                statusCode === 504 ||
                errorMessage.toLowerCase().includes('google account') ||
                errorMessage.toLowerCase().includes('link') ||
                errorMessage.toLowerCase().includes('authenticate') ||
                errorMessage.toLowerCase().includes('token');

            if (!isAuthIssue) {
                console.error('Failed to fetch gmail', err);
            }

            // If it's auth related, provide a friendly message instead of a raw error
            const finalMessage = isAuthIssue
                ? 'Please link your Google account to access emails'
                : errorMessage;

            setError(finalMessage);
        } finally {
            setLoading(false);
        }
    }, [initialMaxResults]);

    const loadMore = useCallback(async () => {
        if (!nextPageToken || loadingMore) return;

        setLoadingMore(true);
        try {
            const data = await gmailService.getMailList({
                maxResults: initialMaxResults,
                pageToken: nextPageToken
            });
            setEmails(prev => [...prev, ...(data.emails || [])]);
            setNextPageToken(data.nextPageToken || null);
        } catch (err: any) {
            console.error('Failed to load more emails', err);
        } finally {
            setLoadingMore(false);
        }
    }, [nextPageToken, loadingMore, initialMaxResults]);

    const getMailDetail = async (id: string) => {
        try {
            return await gmailService.getMailDetail(id);
        } catch (error) {
            console.error('Error fetching detail', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    return {
        emails,
        loading,
        loadingMore,
        error,
        isAuthError: error?.toLowerCase().includes('google account') ||
            error?.toLowerCase().includes('link') ||
            error?.toLowerCase().includes('authenticate') ||
            error?.toLowerCase().includes('token') ||
            error === 'Please link your Google account to access emails',
        refetch: fetchEmails,
        loadMore,
        getMailDetail,
        sendMail: gmailService.sendMail,
        replyMail: gmailService.replyMail
    };
};
