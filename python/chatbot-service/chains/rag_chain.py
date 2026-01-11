import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from utils.history import format_chat_history
from typing import AsyncGenerator
from services.llm_service import LLMService
from services.vectorstore_service import VectorStoreService
from services.retriever_service import RetrieverService
import functools

class RAGChain:
    def __init__(self, llm_service: LLMService, vectorstore_service: VectorStoreService, retriever_service: RetrieverService, threadpool=None):
        self.llm_service = llm_service
        self.vectorstore_service = vectorstore_service
        self.retriever_service = retriever_service
        self.threadpool = threadpool 
        self.last_retrieved_context = None
        
    def clear_last_context(self):
        self.last_retrieved_context = None

    def _format_docs_for_context(self, docs):
        print("[RAG] Đang format context...")
        if not docs: return ""
        formatted_list = []
        for doc in docs:
            content = ""
            if hasattr(doc, 'page_content'):
                content = doc.page_content
            elif isinstance(doc, tuple) and len(doc) > 0:
                content = str(doc[0])
            elif isinstance(doc, dict):
                content = doc.get('page_content') or doc.get('content') or doc.get('text') or ""
            else:
                content = str(doc)
            
            if content.strip():
                formatted_list.append(f"--- Document ---\n{content}")
        return "\n\n".join(formatted_list)
    def _save_context_metadata(self, docs):
        formatted = []
        if not docs: 
            self.last_retrieved_context = []
            return
            
        for doc in docs:
            # print(f"[CONTEXT] Doc: {doc}") # Debug xong có thể comment lại
            content = ""
            meta = {}

            # CASE 1: LangChain Document Object
            if hasattr(doc, 'page_content'):
                content = doc.page_content
                meta = doc.metadata if hasattr(doc, 'metadata') else {}
            
            # CASE 2: Tuple
            elif isinstance(doc, tuple) and len(doc) > 0:
                content = str(doc[0])
                meta = doc[1] if len(doc) > 1 and isinstance(doc[1], dict) else {}
            
            # CASE 3: Dictionary (SỬA Ở ĐÂY)
            elif isinstance(doc, dict):
                # Thêm check key 'text' và 'meta'
                content = doc.get('page_content') or doc.get('content') or doc.get('text') or ""
                meta = doc.get('metadata') or doc.get('meta') or {}
            
            # CASE 4: String/Other
            else:
                content = str(doc)
                meta = {}

            formatted.append({
                "source_id": meta.get("source", "unknown") if meta else "unknown",
                "file_name": meta.get("file_name", "unknown") if meta else "unknown",
                "snippet": content[:150].replace('\n', ' ') + "..." if content else ""
            })
            
        print("[CONTEXT] Last retrieved context:", formatted)
        self.last_retrieved_context = formatted
        
    def get_last_retrieved_context(self):
        return self.last_retrieved_context if self.last_retrieved_context else []
        

    async def ask_question_for_user(self, question: str, user_id: str, team_id: str | None ,chat_history: list):
        collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
        print(f"[RAG] Đang tìm kiếm trong collection: {collection_name}")
        try:
            raw_docs = await self.vectorstore_service.search(collection_name, question, k=10)
        except Exception as e:
            print(f"[RAG ERROR] Lỗi tìm kiếm vector (Ollama Embedding 500?): {e}")
            raw_docs = []
            
        if raw_docs:
            print(f"[RAG] Tìm thấy {len(raw_docs)} tài liệu. Đang Rerank...")
            try:
                final_docs = await self.retriever_service.rerank_documents(question, raw_docs)
                final_docs = final_docs[:5] 
            except Exception as e:
                print(f"[RAG ERROR] Rerank thất bại, dùng kết quả thô: {e}")
                final_docs = raw_docs[:5]
        else:
            print("[RAG] Không tìm thấy tài liệu nào.")
            final_docs = []
        
        self._save_context_metadata(final_docs)
        context_str = self._format_docs_for_context(final_docs)
        print(f"[RAG] Context Preview: {context_str[:100]}...")
        
        history_messages = []
        for msg in chat_history[-6:]: 
            role = "user" if msg.get("role") == "user" else "assistant"
            history_messages.append({"role": role, "content": msg.get("content", "")})
            
        system_prompt = f"""
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

        ## Ngữ cảnh:
        {context_str}
        """
           
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history_messages)
        messages.append({"role": "user", "content": question}) 

        print(f"[RAG] Đang trả lời câu hỏi...")

        def run_chat_sync():
            return self.llm_service.chat(messages)
        
        stream = await asyncio.to_thread(run_chat_sync)
        
        for chunk in stream:
            content = chunk.get('message', {}).get('content', '')
            if content:
                print(content, end="", flush=True)
                yield content
            