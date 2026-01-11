import asyncio
from services.llm_service import LLMService

class Summarizer:
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service

    async def summarize(self, documents):
        if not documents:
            yield "Không có nội dung để tóm tắt."
            return
        
        print(documents)
        full_text = "\n\n".join([doc.page_content for doc in documents])
        
        system_prompt = f"""
            Bạn là một trợ lý AI chuyên tóm tắt văn bản.
            Hãy viết một bản tóm tắt chi tiết và đầy đủ ý chính cho toàn bộ nội dung sau đây:

            Nội dung:
            "{full_text}"

            BẢN TÓM TẮT:
        """
        messages = [
            {"role": "user", "content": system_prompt}
        ]

        print(f"--> [SUMMARIZE] Đang tóm tắt nội dung")
        
        def run_chat_sync():
            return self.llm_service.chat(messages)
            
        stream = await asyncio.to_thread(run_chat_sync)

        for chunk in stream:
            content = chunk.get('message', {}).get('content', '')
            if content:
                yield content
                
    
    async def summarize_objective(self, objective: str) -> str:
        """
        Tóm tắt mục tiêu thành đúng 5 từ, không ký tự đặc biệt.
        """
        prompt= """
            Bạn là một chuyên gia phân tích dự án. 
            Nhiệm vụ:  Người dùng đã nhập một yêu cầu rất chi tiết hoặc dài dòng về một mục tiêu dự án.
            Nhiệm vụ của bạn là trích xuất và tóm tắt lại mục tiêu cốt lõi đó thành một câu hoặc một đoạn ngắn gọn
            
            RÀO CẢN NGHIÊM NGẶT:
            1. Chỉ trả về ĐÚNG 5 TỪ.
            2. KHÔNG sử dụng dấu câu hoặc ký tự đặc biệt (.,!?-...).
            3. Giữ lại các từ khóa kỹ thuật quan trọng nhất.

            YÊU CẦU GỐC:
            "{objective}"

            MỤC TIÊU CỐT LÕI (5 TỪ):
        """
        
        messages = [{"role": "user", "content": prompt}]
        
        try:
            response = await asyncio.to_thread(
                self.llm_service.chat,
                messages
            )
            
            content = response.get('message', {}).get('content', '')
            return content.strip()
            
        except Exception as e:
            print(f"--> [ERROR] Lỗi khi tóm tắt objective: {e}")
            return objective