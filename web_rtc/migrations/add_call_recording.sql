-- Migration: Add call_recording table
-- Run this in your video_chat_db database

CREATE TABLE IF NOT EXISTS call_recording (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "callId"        UUID NOT NULL REFERENCES call(id) ON DELETE CASCADE,
    "requestedBy"   VARCHAR(255) NOT NULL,
    "approvedBy"    VARCHAR(255),
    "startedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "endedAt"       TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'RECORDING', 'COMPLETED', 'FAILED', 'REJECTED')),
    "fileUrl"       TEXT,
    "fileSizeKB"    BIGINT,
    "mimeType"      VARCHAR(100) DEFAULT 'video/webm',
    "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_recording_call_id ON call_recording("callId");
CREATE INDEX IF NOT EXISTS idx_call_recording_status  ON call_recording(status);
