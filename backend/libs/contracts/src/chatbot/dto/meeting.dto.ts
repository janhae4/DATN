export interface MeetingSummaryResponseDto {
    roomId: string;
    event: string;
    data: {
        status: 'start' | 'chunk' | 'end' | 'error';
        content: string;
        metadata?: {
            actionItems?: Array<{ content: string; assignee: string }>;
        };
    };
}