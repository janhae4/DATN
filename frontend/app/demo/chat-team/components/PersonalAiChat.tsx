"use client";

import { Sparkles } from "lucide-react";
import { CurrentUser } from "../types/type";
import { AiKnowledgePage } from "./AiKnowledge";

export function PersonalAiChat({ currentUser }: { currentUser: CurrentUser }) {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Cá nhân</h2>
          <p className="text-sm text-gray-500">
            Cuộc trò chuyện này được cá nhân hóa cho riêng bạn.
          </p>
        </div>
      </div>
      <AiKnowledgePage currentUser={currentUser} />
    </div>
  );
}
