import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from utils.stream_helper import stream_blocking_generator

class Summarizer:
    def __init__(self, llm_service):
        self.llm_service = llm_service

    async def summarize(self, documents):
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

        async for chunk in stream_blocking_generator(_blocking_stream, {"context": documents}):
            if hasattr(chunk, "content"):
                yield chunk.content
            else:
                yield str(chunk)
                
    async def summarize(self, documents):
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

        async for chunk in stream_blocking_generator(_blocking_stream, {"context": documents}):
            if hasattr(chunk, "content"):
                yield chunk.content
            else:
                yield str(chunk)
    
    async def summarize_objective(self, objective: str) -> str:
        """
        Tóm tắt mục tiêu thành đúng 5 từ, không ký tự đặc biệt.
        """
        prompt_template = """
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
        
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm_service.get_llm()
        
        try:
            response = await chain.ainvoke({"objective": objective})
            
            if hasattr(response, "content"):
                return response.content.strip()
            return str(response).strip()
            
        except Exception as e:
            print(f"--> [ERROR] Lỗi khi tóm tắt objective: {e}")
            return objective  
