import React from "react";
import { Send, Loader2 } from "lucide-react";

interface AiPromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  isStreaming: boolean;
  handleSendAiMessage: () => void;
}

export function AiPromptInput({
  prompt,
  setPrompt,
  isStreaming,
  handleSendAiMessage,
}: AiPromptInputProps) {
  return (
    <footer className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendAiMessage();
          }}
          className="flex items-center bg-slate-100 rounded-lg p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Hỏi AI về tài liệu của bạn..."
            className="flex-grow bg-transparent outline-none px-2 text-slate-800"
            disabled={isStreaming}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendAiMessage();
              }
            }}
          />
          <button
            type="submit"
            className="p-2 rounded-md bg-indigo-600 text-white disabled:bg-slate-300 transition-colors"
            disabled={!prompt.trim() || isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </footer>
  );
}
