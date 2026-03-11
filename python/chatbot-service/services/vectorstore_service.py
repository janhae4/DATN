from datetime import datetime
import os
import chromadb
from config import CHROMA_HOST, CHROMA_PORT, INDEX_DOCUMENT_CHUNK_ROUTING_KEY
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.minio_service import MinioService
import asyncio
from utils_retry import retry_async

class VectorStoreService:
    def __init__(self, gemini_service, minio: MinioService):
        # Sử dụng HttpClient để kết nối tới ChromaDB server (nhẹ hơn)
        self.client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        self.minio = minio
        self.llm = gemini_service

    def _get_collection(self, name):
        return self.client.get_or_create_collection(name=name)

    @retry_async(max_retries=3, delay=1, backoff=2)
    async def delete_collection(self, collection_name: str):
        try:
            print(f"[VectorStore] Đang xóa collection: {collection_name}")
            def _delete():
                self.client.delete_collection(name=collection_name)
            await asyncio.to_thread(_delete)
        except Exception as e:
            print(f"[VectorStore] Lỗi khi xóa collection: {e}")
    
    @retry_async(max_retries=3, delay=1, backoff=2)
    async def delete_documents_by_source(self, collection_name: str, file_source: str):
        try:
            collection = self._get_collection(collection_name)
            def _delete():
                collection.delete(where={"source": file_source})
            await asyncio.to_thread(_delete)
        except Exception as e:
            print(f"[VectorStore] Lỗi khi xóa document: {e}")
    
    @retry_async(max_retries=3, delay=1, backoff=2)
    async def search(self, collection_name: str, query: str, k: int = 5, file_ids: list = None):
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            return []

        # Lấy embedding từ Gemini
        query_vec = self.llm.get_embedding(query)

        query_kwargs = {
            "query_embeddings": [query_vec],
            "n_results": k,
            "include": ["documents", "metadatas", "distances"]
        }

        if file_ids and len(file_ids) > 0:
            if len(file_ids) == 1:
                query_kwargs["where"] = {"source": file_ids[0]}
            else:
                query_kwargs["where"] = {"source": {"$in": file_ids}}

        results = collection.query(**query_kwargs)

        formatted_docs = []
        if results['ids'] and results['ids'][0]:
            from langchain_core.documents import Document
            for i in range(len(results['ids'][0])):
                formatted_docs.append(Document(
                    page_content=results['documents'][0][i], 
                    metadata=results['metadatas'][0][i]
                ))
        return formatted_docs
            
    async def process_and_store(self, user_id: str, file_id: str, search_exchange, team_id: str | None = None, original_name: str | None = None):
        raw_docs = await self.minio.load_documents(file_id, original_name)
        if not raw_docs: return 

        collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
        collection = self._get_collection(collection_name)
        
        # Check cache
        existing = collection.get(where={"source": file_id}, include=["metadatas"])
        if existing and existing['ids']:
            print(f"--> [CACHE HIT] File '{file_id}' đã tồn tại.")
            return raw_docs

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(raw_docs)

        ids, embeddings, metadatas, documents_content = [], [], [], []
        processing_time = datetime.utcnow().isoformat()
        
        for i, doc in enumerate(docs):
            content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
            if not content: continue

            vector = self.llm.get_embedding(content)
            if not vector: continue

            final_meta = {"user_id": user_id, "source": file_id, "chunk_id": i, "processed_at": processing_time}
            if team_id: final_meta["team_id"] = team_id
            if hasattr(doc, 'metadata'): final_meta.update(doc.metadata)

            ids.append(f"{file_id}_{i}")
            embeddings.append(vector)
            metadatas.append(final_meta)
            documents_content.append(content)

        if ids:
            collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents_content)
        
        return raw_docs
