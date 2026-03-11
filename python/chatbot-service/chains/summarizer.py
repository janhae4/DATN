import asyncio
class Summarizer:
    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.semaphore = asyncio.Semaphore(2)  # Giới hạn tối đa 2 task tóm tắt song song cho Ollama
        
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
        text_len = len(full_text)
        
        # CHIẾN THUẬT 1: "STUFFING" - Nếu văn bản đủ nhỏ (< 20k ký tự), tóm tắt luôn trong 1 bước
        if text_len < 20000:
            print(f"--> [SUMMARIZE STUFF] Văn bản ngắn ({text_len} ký tự), tóm tắt trực tiếp...")
            prompt = f"""
                Bạn là chuyên gia phân tích. Hãy viết bản tóm tắt chi tiết, rành mạch bằng Markdown cho văn bản sau:
                VĂN BẢN:
                {full_text}
                TÓM TẮT:
            """
            messages = [{"role": "user", "content": prompt}]
            def run_stuff_sync():
                return self.llm_service.chat(messages)
            
            stream = await asyncio.to_thread(run_stuff_sync)
            for chunk in stream:
                content = chunk.get('message', {}).get('content', '')
                if content:
                    yield content
            return

        # CHIẾN THUẬT 2: MAP-REDUCE TỐI ƯU
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        # Tăng chunk_size để giảm số lượng lần gọi LLM
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=20000, chunk_overlap=2000)
        chunks = text_splitter.split_text(full_text)
        
        print(f"--> [SUMMARIZE MAP-REDUCE] Bước MAP: Tóm tắt {len(chunks)} Chunks với Semaphore...")
        
        # Ép đầu ra cực ngắn để tiết kiệm thời gian sinh token
        map_prompt_template = """
            Trích xuất 5-10 ý chính quan trọng nhất dưới dạng đầu dòng cực ngắn gọn.
            VĂN BẢN: "{text}"
            TRẢ LỜI (Bullet points):
        """
        
        async def map_chunk(chunk_text):
            async with self.semaphore: # Chờ nếu đã có 2 task đang chạy
                messages = [{"role": "user", "content": map_prompt_template.format(text=chunk_text)}]
                try:
                    response = await asyncio.to_thread(self.llm_service.chatWithOutStream, messages)
                    return response.get('message', {}).get('content', '')
                except Exception as e:
                    print(f"[MAP ERROR] {e}")
                    return ""

        map_results = await asyncio.gather(*(map_chunk(chunk) for chunk in chunks))
        combined_summaries = "\n---\n".join([res for res in map_results if res])

        print(f"--> [SUMMARIZE MAP-REDUCE] Bước REDUCE: Tổng hợp kết quả...")
        reduce_prompt = f"""
            Dựa trên các ý chính sau, hãy viết một bản tóm tắt tổng thể hoàn chỉnh bằng Markdown:
            {combined_summaries}
            BẢN TÓM TẮT CUỐI CÙNG:
        """
        
        reduce_messages = [{"role": "user", "content": reduce_prompt}]
        def run_reduce_sync():
            return self.llm_service.chat(reduce_messages)
            
        stream = await asyncio.to_thread(run_reduce_sync)
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
