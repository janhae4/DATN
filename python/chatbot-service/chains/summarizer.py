import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain

async def _stream_blocking_generator(gen_func, *args):
    loop = asyncio.get_running_loop()
    q = asyncio.Queue()
    sentinel = object()

    def _runner():
        try:
            for item in gen_func(*args):
                loop.call_soon_threadsafe(q.put_nowait, item)
        except Exception as e:
            loop.call_soon_threadsafe(q.put_nowait, f"__ERROR__:{e}")
        finally:
            loop.call_soon_threadsafe(q.put_nowait, sentinel)

    asyncio.get_running_loop().run_in_executor(None, _runner)

    while True:
        item = await q.get()
        if item is sentinel:
            break
        if isinstance(item, str) and item.startswith("__ERROR__:"):
            raise RuntimeError(item[len("__ERROR__:"):])
        yield item

class Summarizer:
    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.split_marker = "###__JSON_SPLIT__###"

    async def summarize_documents(self, documents):
        prompt_template = """
            Bạn là một trợ lý AI chuyên tóm tắt văn bản.
            Hãy viết một bản tóm tắt chi tiết và đầy đủ ý chính cho toàn bộ nội dung sau đây:

            Nội dung:
            "{context}"

            BẢN TÓM TẮT:
    """
        prompt = ChatPromptTemplate.from_template(prompt_template)
        summarize_chain = create_stuff_documents_chain(self.llm_service.get_llm(), prompt)

        def _blocking_stream(params):
            return summarize_chain.stream(params)

        async for chunk in _stream_blocking_generator(_blocking_stream, {"context": documents}):
            if hasattr(chunk, "content"):
                yield chunk.content
            else:
                yield str(chunk)

    async def summarize_meeting(self, text: str):
            prompt_template = """
            Bạn là thư ký cuộc họp chuyên nghiệp. 
            Nhiệm vụ của bạn là xử lý nội dung cuộc họp dưới đây:
            {text}

            Hãy thực hiện 2 bước sau:
            
            BƯỚC 1: VIẾT BÁO CÁO (Cho người dùng đọc)
            - Viết tóm tắt nội dung chính bằng tiếng Việt.
            - Sử dụng định dạng Markdown (in đậm, gạch đầu dòng) để trình bày đẹp mắt.
            - Tuyệt đối KHÔNG viết JSON ở bước này.

            BƯỚC 2: TRÍCH XUẤT DỮ LIỆU (Cho hệ thống xử lý)
            - In ra dòng chữ chính xác này để ngăn cách: {split_marker}
            - Sau dòng đó, chỉ trả về một mảng JSON (Array) chứa danh sách Action Items.
            - Cấu trúc JSON: [{{"content": "tên task", "assignee": "tên người hoặc null"}}]
            
            Bắt đầu:
            """
            prompt = ChatPromptTemplate.from_template(prompt_template)
            final_prompt = prompt.partial(split_marker=self.split_marker)
            
            summarize_chain = final_prompt | self.llm_service.get_llm()
            
            def _blocking_stream(params):
                return summarize_chain.stream(params)
            
            is_json_mode = False
            buffer = ""
            marker_len = len(self.split_marker)

            async for chunk in _stream_blocking_generator(_blocking_stream, {"text": text}):
                content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                if not content: continue

                if is_json_mode:
                    yield { "type": "json_chunk", "content": content }
                    continue

                buffer += content

                if self.split_marker in buffer:
                    parts = buffer.split(self.split_marker, 1)
                    text_part = parts[0]
                    json_part = parts[1]

                    if text_part:
                        yield { "type": "text", "content": text_part }
                    
                    is_json_mode = True
                    
                    if json_part:
                        yield { "type": "json_chunk", "content": json_part }
                    
                    buffer = ""
                
                else:
                    if len(buffer) > marker_len:
                        safe_to_yield = buffer[:-marker_len]
                        keep_in_buffer = buffer[-marker_len:]
                        
                        yield { "type": "text", "content": safe_to_yield }
                        buffer = keep_in_buffer
                    else:
                        pass

            if buffer and not is_json_mode:
                yield { "type": "text", "content": buffer }