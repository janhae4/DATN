"use client";
import { useState, useRef } from "react";

export default function Page() {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Trình duyệt không hỗ trợ Speech Recognition");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e) => console.error("Speech error:", e);

    recognition.onresult = async (event) => {
      const resultText = event.results[0][0].transcript;
      setText(resultText);

      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: resultText }),
      });
      const translation = await response.json();
      console.log(translation)
      alert(translation.entities)
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">
        🎤 Speech to Text
      </h1>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-full text-white font-semibold transition ${
          isRecording
            ? "bg-red-500 animate-pulse"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isRecording ? "⏹ Dừng ghi" : "🎙 Nhấn để nói"}
      </button>

      <textarea
        className="mt-6 w-full max-w-lg h-40 p-4 border rounded-lg shadow"
        placeholder="Kết quả giọng nói sẽ hiện ở đây..."
        value={text}
        readOnly
      />
    </div>
  );
}
