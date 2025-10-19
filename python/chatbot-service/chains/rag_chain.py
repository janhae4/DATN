import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from utils.history import format_chat_history
from typing import AsyncGenerator
from concurrent.futures import ThreadPoolExecutor
from config import THREADPOOL_MAX_WORKERS
from models.reranker import SentenceTransformerRerank
import functools

async def _stream_blocking_generator(gen_func, *args, loop=None) -> AsyncGenerator[str, None]:
    loop = loop or asyncio.get_running_loop()
    q: asyncio.Queue = asyncio.Queue()
    sentinel = object()

    def _runner():
        try:
            for item in gen_func(*args):
                loop.call_soon_threadsafe(q.put_nowait, item)
        except Exception as e:
            loop.call_soon_threadsafe(q.put_nowait, f"__ERROR__:{e}")
        finally:
            loop.call_soon_threadsafe(q.put_nowait, sentinel)

    t = asyncio.get_running_loop().run_in_executor(None, _runner)

    while True:
        item = await q.get()
        if item is sentinel:
            break
        if isinstance(item, str) and item.startswith("__ERROR__:"):
            raise RuntimeError(item[len("__ERROR__:"):])
        yield item

class RAGChain:
    def __init__(self, llm_service, vectorstore_service, retriever_service, threadpool: ThreadPoolExecutor = None):
        self.llm_service = llm_service
        self.vectorstore_service = vectorstore_service
        self.retriever_service = retriever_service
        self.threadpool = threadpool or ThreadPoolExecutor(max_workers=THREADPOOL_MAX_WORKERS)

    async def ask_question_for_user(self, question: str, user_id: str, chat_history: list):
        collection_name = f"user_{user_id}"
        
        embeddings = self.llm_service.get_embeddings()
        vectorstore = await self.vectorstore_service.get_collection(
            collection_name,
            embedding_function=embeddings
        )
        base_retriever = vectorstore.as_retriever()
        
        retriever = await self.retriever_service.build_compression_retriever(base_retriever)
        docs = retriever.invoke(question)

        if self.retriever_service.use_reranker:
            reranker = SentenceTransformerRerank(self.retriever_service.reranker_model, top_n=3)
            docs = reranker.compress_documents(docs, question)    

        prompt_template = """
        ### VAI TRÒ CỦA BẠN ###
        Bạn là một trợ lý AI thân thiện và linh hoạt, có khả năng giao tiếp tự nhiên và hỗ trợ người dùng chính xác nhất có thể.
        Khi được hỏi tên, chỉ cần nói rằng bạn là một trợ lý AI (không nhận tên người dùng làm tên của mình).

        ### CÁCH BẠN XỬ LÝ CÂU HỎI ###
        1. Đọc kỹ <question>, <context> và <chat_history> để hiểu rõ yêu cầu.
        2. Nếu <context> có thông tin liên quan, ưu tiên dùng nó để trả lời.
        3. Nếu câu hỏi mang tính hội thoại (chào hỏi, xã giao), hãy phản hồi tự nhiên.
        4. Nếu câu hỏi liên quan đến nội dung trước đó, tham chiếu từ <chat_history>.
        5. Nếu không tìm thấy thông tin phù hợp trong <context> hoặc <chat_history>, hãy trả lời dựa trên kiến thức chung — nhưng đừng bịa.
        6. Nếu không chắc chắn, hãy nói bạn chưa có đủ thông tin thay vì đoán.

        ### PHONG CÁCH TRẢ LỜI ###
        - Tự nhiên, gần gũi, không máy móc.
        - Ngắn gọn nếu câu hỏi đơn giản; chi tiết nếu câu hỏi phức tạp.
        - Tránh lặp lại nguyên văn dữ liệu từ <context>, hãy diễn giải lại.

        ### DỮ LIỆU ĐẦU VÀO ###

        ## Lịch sử:
        {chat_history}

        ## Ngữ cảnh:
        {context}

        ## Câu hỏi:
        {input}
        """
    
        prompt = ChatPromptTemplate.from_template(prompt_template)
        document_chain = create_stuff_documents_chain(self.llm_service.get_llm(), prompt)
        rag_chain = create_retrieval_chain(retriever, document_chain)

        formatted_history = format_chat_history(chat_history)

        def _blocking_stream(params):
            return rag_chain.stream(params)

        gen = functools.partial(_blocking_stream, {"input": question, "chat_history": formatted_history})
        async for chunk in _stream_blocking_generator(gen):
            if isinstance(chunk, dict):
                if "answer" in chunk and chunk["answer"]:
                    yield chunk["answer"]
                continue
            content = getattr(chunk, "content", None)
            
            if content:
                yield content
                continue
            
            chunk_str = str(chunk).strip()
            if chunk_str and not chunk_str.startswith("{") and not chunk_str.endswith("}"):
                yield chunk_str
