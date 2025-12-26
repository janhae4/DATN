import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
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
