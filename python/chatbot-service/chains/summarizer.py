import asyncio
class Summarizer:
    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.semaphore = asyncio.Semaphore(10)  # Tăng lên 10 task song song cho Gemini API
        
    async def summarize(self, documents):
        print(f"--> [SUMMARIZE] Bắt đầu quá trình tóm tắt tài liệu...")
        if not documents:
            print(f"--> [SUMMARIZE] Lỗi: Không có nội dung để tóm tắt.")
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
        print(f"--> [SUMMARIZE] Tổng độ dài văn bản: {text_len} ký tự.")
        
        if text_len < 100000:
            print(f"--> [SUMMARIZE STUFF] Văn bản ngắn ({text_len} ký tự), tóm tắt trực tiếp...")
            prompt = f"""
                Bạn là một chuyên gia phân tích và điều phối dự án.
                Hãy viết một bản tóm tắt chi tiết, chuyên nghiệp bằng định dạng Markdown cho văn bản dưới đây.
                
                Yêu cầu bản tóm tắt phải có các phần sau:
                1. **Nội dung chính**: Tóm tắt ngắn gọn nhưng đầy đủ các vấn đề được thảo luận hoặc trình bày.
                2. **Quyết định & Hành động**: Các kết luận hoặc các bước tiếp theo cần thực hiện (nếu có).
                3. **Kỹ năng liên quan (Required Skills)**: Dựa trên nội dung (đặc biệt nếu là bản ghi chép cuộc họp hoặc yêu cầu công việc), hãy liệt kê các kỹ năng kỹ thuật hoặc chuyên môn cần thiết để thực hiện các công việc được đề cập. Bạn có thể tự đề xuất các kỹ năng mới nếu thấy phù hợp.
                
                VĂN BẢN:
                {full_text}
                
                Lưu ý: Không viết câu dẫn (ví dụ: "Đây là bản tóm tắt..."), hãy bắt đầu trực tiếp bằng Markdown.
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
            print(f"--> [SUMMARIZE] Hoàn tất tóm tắt bằng chiến thuật STUFF.")
            return

        from langchain_text_splitters import RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=50000, chunk_overlap=5000)
        chunks = text_splitter.split_text(full_text)
        
        print(f"--> [SUMMARIZE MAP-REDUCE] Bước MAP: Phân mảnh tài liệu thành {len(chunks)} Chunks...")
        
        chunk_count = len(chunks)
        completed_chunks = 0
        
        map_prompt_template = """
            Trích xuất 5-10 ý chính quan trọng nhất dưới dạng đầu dòng cực ngắn gọn.
            VĂN BẢN: "{text}"
            TRẢ LỜI (Bullet points):
        """
        
        async def map_chunk(index, chunk_text):
            nonlocal completed_chunks
            async with self.semaphore:
                print(f"--> [SUMMARIZE MAP] Đang xử lý chunk {index+1}/{chunk_count}...")
                messages = [{"role": "user", "content": map_prompt_template.format(text=chunk_text)}]
                try:
                    response = await asyncio.to_thread(self.llm_service.chatWithOutStream, messages)
                    completed_chunks += 1
                    print(f"--> [SUMMARIZE MAP] Hoàn tất chunk {index+1}/{chunk_count} ({completed_chunks}/{chunk_count}).")
                    return response.get('message', {}).get('content', '')
                except Exception as e:
                    print(f"[MAP ERROR] Lỗi chunk {index+1}: {e}")
                    return ""

        map_results = await asyncio.gather(*(map_chunk(i, chunk) for i, chunk in enumerate(chunks)))
        combined_summaries = "\n---\n".join([res for res in map_results if res])

        print(f"--> [SUMMARIZE MAP-REDUCE] Bước REDUCE: Tổng hợp kết quả...")
        reduce_prompt = f"""
            Bạn là một chuyên gia tổng hợp thông tin. 
            Dựa trên các ý chính đã trích xuất từ các phần khác nhau của tài liệu dưới đây, hãy viết một bản tóm tắt tổng thể chuyên nghiệp bằng Markdown.
            
            Bản tóm tắt phải bao quát được:
            - Tổng quan nội dung chính của toàn bộ tài liệu.
            - Các điểm quan trọng nhất, các quyết định hoặc mục tiêu đề ra.
            - **Danh sách Kỹ năng (Required Skills)**: Tổng hợp tất cả các kỹ năng cần thiết hoặc được nhắc đến xuyên suốt tài liệu. Có thể đề xuất kỹ năng mới nếu cần.
            
            CÁC Ý CHÍNH:
            {combined_summaries}
            
            Lưu ý: Chỉ trả về nội dung Markdown, không có câu giới thiệu.
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
        print(f"--> [SUMMARIZE] Hoàn tất tóm tắt bằng chiến thuật MAP_REDUCE.")
                
    
    async def summarize_objective(self, objective: str) -> str:
        """
        Tóm tắt mục tiêu thành đúng 5 từ, không ký tự đặc biệt.
        """
        print(f"--> [SUMMARIZE OBJECTIVE] Đang tóm tắt mục tiêu: {objective[:50]}...")
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
            summarized = content.strip()
            print(f"--> [SUMMARIZE OBJECTIVE] Kết quả: {summarized}")
            return summarized
            
        except Exception as e:
            print(f"--> [ERROR] Lỗi khi tóm tắt objective: {e}")
            return objective
