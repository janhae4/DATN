import asyncio
from services.vectorstore_service import VectorStoreService
from services.retriever_service import RetrieverService

class RAGChain:
    def __init__(self, llm_service, vectorstore_service: VectorStoreService, retriever_service: RetrieverService, threadpool=None):
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
            self.last_retrieved_context = {}
            return
            
        for doc in docs:
            content = ""
            meta = {}

            if hasattr(doc, 'page_content'):
                content = doc.page_content
                meta = doc.metadata if hasattr(doc, 'metadata') else {}
            
            elif isinstance(doc, tuple) and len(doc) > 0:
                content = str(doc[0])
                meta = doc[1] if len(doc) > 1 and isinstance(doc[1], dict) else {}
            
            elif isinstance(doc, dict):
                content = doc.get('page_content') or doc.get('content') or doc.get('text') or ""
                meta = doc.get('metadata') or doc.get('meta') or {}
            
            else:
                content = str(doc)
                meta = {}

            formatted.append({
                "source_id": meta.get("source", "unknown"),
                "source_name": meta.get("file_name", "unknown"),
                "chunk_id": 0,
                "score": 0,
                "snippet": content[:150]
            })
            
        print("[CONTEXT] Last retrieved context:", formatted)
        self.last_retrieved_context = {
            "retrieved_context": formatted
        }
        
    def get_last_retrieved_context(self):
        return self.last_retrieved_context if self.last_retrieved_context else []
        

    async def ask_question_for_user(self, question: str, user_id: str, team_id: str | None, chat_history: list, file_ids: list = None):
        collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
        print(f"[RAG] Đang tìm kiếm trong collection: {collection_name}")
        if file_ids:
            print(f"[RAG] Filter theo file_ids: {file_ids}")
        try:
            raw_docs = await self.vectorstore_service.search(collection_name, question, k=10, file_ids=file_ids)
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
        Bạn là Taskora AI - một trợ lý thông minh, chuyên nghiệp và cực kỳ thân thiện.
        Nhiệm vụ cốt lõi của bạn là giúp đỡ người dùng bằng cách tổng hợp thông tin từ Ngữ cảnh và Lịch sử trò chuyện.

        ### CÁC NGUYÊN TẮC VÀNG:
        1. **Ưu tiên Ngữ cảnh**: Luôn ưu tiên thông tin từ phần "Ngữ cảnh" bên dưới. Nếu thông tin có sẵn ở đó, hãy trả lời chính xác và dẫn dắt người dùng.
        2. **Thoải mái & Tự nhiên**: Phản hồi như một người bạn đồng hành. Nếu là câu hỏi xã giao (chào hỏi, cảm ơn), hãy đáp lại thật ấm áp và tự nhiên.
        3. **Trung thực & Không bịa đặt**: 
           - Nếu "Ngữ cảnh" không có thông tin và kiến thức chung của bạn cũng không chắc chắn, hãy nói: "Rất tiếc, mình chưa tìm thấy thông tin này trong tài liệu của bạn. Tuy nhiên, dựa trên kiến thức chung thì...".
           - Tuyệt đối không bịa ra các sự thật không có thật.
        4. **Định dạng Markdown**: Sử dụng Bold, Bullet points, hoặc Bảng nếu cần thiết để câu trả lời gọn gàng, chuyên nghiệp.
        5. **Ngôn ngữ**: Trả lời bằng ngôn ngữ người dùng đang hỏi (ưu tiên tiếng Việt).

        ### NGỮ CẢNH TÀI LIỆU:
        {context_str}
        
        ---
        Bây giờ, hãy dựa trên các quy tắc trên để trả lời câu hỏi của người dùng một cách xuất sắc nhất.
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
                # print(content, end="", flush=True)
                yield content
