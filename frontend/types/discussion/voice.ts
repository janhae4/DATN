export interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
    isSpeaking?: boolean;
}
