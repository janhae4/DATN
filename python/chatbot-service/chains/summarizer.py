import asyncio
from services.llm_service import LLMService

class Summarizer:
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        
    async def summarize(self, documents):
        if not documents:
            yield "Không có nội dung để tóm tắt."
            return
        
        text_parts = []
        for doc in documents:
            if hasattr(doc, 'page_content'):
                text_parts.append(doc.page_content)
            elif isinstance(doc, tuple) and len(doc) > 0:
                text_parts.append(str(doc[0]))
            elif isinstance(doc, str):
                text_parts.append(doc)
            elif isinstance(doc, dict) and 'page_content' in doc:
                text_parts.append(doc['page_content'])
                
        full_text = "\n\n".join(text_parts)
        
        # Step 1: Text Splitting (Tránh vỡ Token Limit)
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=15000, chunk_overlap=1500)
        chunks = text_splitter.split_text(full_text)
        
        # Step 2: MAP Phase - Tóm tắt từng cục nhỏ song song
        print(f"--> [SUMMARIZE MAP-REDUCE] Bước MAP: Bắt đầu tóm tắt {len(chunks)} Chunks nhỏ...")
        
        map_prompt_template = """
            Tóm tắt NGẮN GỌN các ý quan trọng nhất của phần văn bản sau.
            VĂN BẢN: "{text}"
            TRẢ LỜI:
        """
        
        async def map_chunk(chunk_text):
            messages = [{"role": "user", "content": map_prompt_template.format(text=chunk_text)}]
            try:
                response = await asyncio.to_thread(self.llm_service.chatWithOutStream, messages)
                return response.get('message', {}).get('content', '')
            except Exception as e:
                print(f"[MAP ERROR] {e}")
                return ""

        map_results = await asyncio.gather(*(map_chunk(chunk) for chunk in chunks))
        
        combined_summaries = "\n---\n".join([res for res in map_results if res])

        print(f"--> [SUMMARIZE MAP-REDUCE] Bước REDUCE: Đang tổng hợp thành tóm tắt cuối cùng...")
        reduce_prompt = f"""
            Bạn là một chuyên gia AI phân tích tài liệu và họp hành. 
            Tôi có một tập hợp các đoạn tóm tắt nhỏ được trích xuất từ một tài liệu/cuộc họp dài:
            
            CÁC ĐOẠN TÓM TẮT BỘ PHẬN:
            {combined_summaries}
            
            YÊU CẦU:
            Hãy viết một bản tóm tắt tổng thể (Final Summary) thống nhất, chi tiết, rành mạch và phân biệt rõ các ý chính cho toàn bộ dữ liệu trên.
            
            BẢN TÓM TẮT TỔNG THỂ (Dùng Markdown):
        """
        
        reduce_messages = [{"role": "user", "content": reduce_prompt}]
        
        def run_chat_sync():
            return self.llm_service.chat(reduce_messages)
            
        stream = await asyncio.to_thread(run_chat_sync)

        for chunk in stream:
            content = chunk.get('message', {}).get('content', '')
            if content:
                yield content
                
    
    async def summarize_objective(self, objective: str) -> str:
        """
        Tóm tắt mục tiêu thành đúng 5 từ, không ký tự đặc biệt.
        """
        prompt= f"""
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
                self.llm_service.chatWithOutStream,
                messages
            )
            
            content = response.get('message', {}).get('content', '')
            return content.strip()
            
        except Exception as e:
            print(f"--> [ERROR] Lỗi khi tóm tắt objective: {e}")
            return objective
