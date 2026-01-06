export interface MinioWebhookEvent {
    Records: Array<{
        s3: {
            object: {
                key: string;
            };
        };
    }>;
}