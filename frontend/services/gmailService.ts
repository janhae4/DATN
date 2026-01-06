import apiClient from './apiClient';

export interface GmailMessage {
    id: string;
    threadId: string;
    from: string;
    to?: string;
    subject: string;
    date: string;
    snippet: string;
    labels?: string[];
    body?: string; // Available in detail view
}

export interface GetMailListResponse {
    emails: GmailMessage[];
    nextPageToken?: string;
    resultSizeEstimate?: number;
}

export const gmailService = {
    getMailList: async (params: { q?: string; pageToken?: string; maxResults?: number } = {}) => {
        const response = await apiClient.get<GetMailListResponse>('/gmail/mails', { params });
        return response.data;
    },

    getMailDetail: async (messageId: string) => {
        const response = await apiClient.get<GmailMessage>(`/gmail/mails/${messageId}`);
        return response.data;
    },

    getUnread: async () => {
        const response = await apiClient.get('/gmail/unread');
        return response.data;
    },

    sendMail: async (data: { to: string; subject: string; content: string; cc?: string[]; bcc?: string[] }) => {
        const response = await apiClient.post('/gmail/send', data);
        return response.data;
    },

    replyMail: async (data: { messageId: string; threadId: string; to: string; subject: string; content: string }) => {
        const response = await apiClient.post('/gmail/reply', data);
        return response.data;
    }
};
