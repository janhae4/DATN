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

        async for chunk in _stream_blocking_generator(_blocking_stream, {"context": documents}):
            # chunk may be text or object
            if hasattr(chunk, "content"):
                yield chunk.content
            else:
                yield str(chunk)
