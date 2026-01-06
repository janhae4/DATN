from typing import List, Dict

def format_chat_history(chat_history: List[Dict]) -> str:
    if not chat_history:
        return "Không có lịch sử trò chuyện."
    formatted = []
    for m in chat_history:
        role = m.get("role", "")
        content = m.get("content", "")
        formatted.append(f"{role}: {content}")
    return "\n".join(formatted)
