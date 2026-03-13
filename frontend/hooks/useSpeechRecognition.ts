import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = (
  onResult: (transcript: string) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Store the latest callback to avoid recreating SpeechRecognition on every render
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN'; // Support Vietnamese

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      if (transcript.trim()) {
        onResultRef.current(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Ignore the no-speech error, onend will handle restarting if still listening.
        return;
      }
      console.warn("⚠️ Ghi âm hội thoại lỗi (Speech error):", event.error);
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setIsListening(false); // Ngắt lặp vô hạn nếu không có mic hoặc bị từ chối
      }
    };

    // Auto-restart if it stops unexpectedly (due to silence limit) but intended to be listening
    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // ignore already started errors
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []); // Run only once to setup the instance

  // Effect to manage starting and stopping based on isListening
  useEffect(() => {
    if (recognitionRef.current) {
      if (isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) { }
      } else {
        recognitionRef.current.stop();
      }
    }
  }, [isListening]);

  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

  return { isListening, startListening, stopListening };
};