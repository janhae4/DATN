import { useRef, useEffect, useCallback } from "react";

// ---- Web Speech API type shim ----
export interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}

interface ISpeechRecognitionCtor {
    new(): ISpeechRecognition;
}

export function getSpeechRecognition(): ISpeechRecognitionCtor | null {
    if (typeof window === "undefined") return null;
    return (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        null
    );
}

/**
 * Runs SpeechRecognition on the local mic.
 * Calls `onTranscript(text, isFinal)` for every result.
 * Auto-restarts when `enabled` is true.
 */
export function useLocalCC(
    enabled: boolean,
    onTranscript: (text: string, isFinal: boolean) => void
) {
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        const Ctor = getSpeechRecognition();
        if (!Ctor) return;

        const r = new Ctor();
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-US";

        r.onresult = (event: any) => {
            let interim = "";
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const res = event.results[i];
                if (res.isFinal) final += res[0].transcript;
                else interim += res[0].transcript;
            }
            if (final) onTranscript(final.trim(), true);
            else if (interim) onTranscript(interim, false);
        };

        r.onerror = (e: any) => {
            if (e.error !== "no-speech") console.warn("SpeechRecognition error:", e.error);
        };

        r.onend = () => {
            if (enabledRef.current && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch { /* already running */ }
            }
        };

        r.start();
        recognitionRef.current = r;
    }, [onTranscript]);

    useEffect(() => {
        if (enabled) start();
        else stop();
        return () => stop();
    }, [enabled, start, stop]);
}
