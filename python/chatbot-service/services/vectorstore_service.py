from datetime import datetime
import json
import os
import chromadb
from config import CHROMA_HOST, CHROMA_PORT
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.minio_service import MinioService
from services.llm_service import LLMService
from aio_pika import Channel, Message, Exchange
from config import INDEX_DOCUMENT_CHUNK_ROUTING_KEY
import asyncio


class VectorStoreService:
    def __init__(self, llm_service: LLMService, minio: MinioService):
        self.client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        self.minio = minio
        self.llm = llm_service

    def _get_collection(self, name):
        return self.client.get_or_create_collection(name=name)
    
    async def delete_documents_by_source(self, collection_name: str, file_source: str):
        try:
            collection = await self.get_collection(collection_name)
            print(f"[VectorStore] Đang xóa các chunk cũ của file: {file_source} trong collection {collection_name}")
            
            def _delete():
                collection.delete(where={"source": file_source})

            await asyncio.to_thread(_delete)
            print(f"[VectorStore] Đã xóa thành công các chunk cũ.")
            
        except Exception as e:
            print(f"[VectorStore] Không thể xóa chunk cũ (có thể là file mới): {e}")
    
    async def search(self, collection_name: str, query: str, k: int = 5):
        """
        Tìm kiếm vector bằng native client (không qua LangChain)
        """
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            print(f"Collection {collection_name} chưa tồn tại.")
            return []

        query_vec = self.llm.get_embedding(query)

        results = collection.query(
            query_embeddings=[query_vec],
            n_results=k,
            include=["documents", "metadatas", "distances"]
        )

        formatted_docs = []
        if results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                doc_content = results['documents'][0][i]
                metadata = results['metadatas'][0][i]
                from langchain_core.documents import Document
                formatted_docs.append(Document(page_content=doc_content, metadata=metadata))
                
        return formatted_docs
            
    async def process_and_store(
        self, 
        user_id: str, 
        file_id: str,
        search_exchange: Exchange,
        team_id: str | None = None,
        ):
        print(f"[VectorStore] Đang tải file: {file_id}")
        raw_docs = await self.minio.load_documents(file_id)
        
        if not raw_docs:
            print(f"[VectorStore] Không tải được tài liệu: {file_id}")
            return 

        collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
        collection = self._get_collection(collection_name)
        
        existing_docs = collection.get(
            where={"source": file_id}, 
            include=["metadatas"] 
        )
        count = 0
        if existing_docs and 'ids' in existing_docs:
            count = len(existing_docs['ids'])
            
        if count > 0:
            print(f"--> [CACHE HIT] File '{file_id}' đã tồn tại ({count} chunks). Bỏ qua Embedding.")
            return raw_docs

        print(f"[VectorStore] Chưa có dữ liệu, bắt đầu Embedding mới...")
        print(f"[VectorStore] Đã tải {len(raw_docs)} tài liệu. Đang tách...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(raw_docs)

        ids = []
        embeddings = []
        metadatas = []
        documents_content = []
        tasks = []

        processing_time = datetime.utcnow().isoformat()
        
        print(f"[VectorStore] Đang xử lý {len(docs)} chunks (Embedding + RabbitMQ)...")
        
        for i, doc in enumerate(docs):
            chunk_id = f"{file_id}_{i}"
            
            doc_content = ""
            doc_metadata = {}

            if hasattr(doc, 'page_content'):
                doc_content = doc.page_content
                doc_metadata = doc.metadata if hasattr(doc, 'metadata') else {}
            elif isinstance(doc, tuple) and len(doc) >= 1:
                doc_content = doc[0]
                if len(doc) > 1:
                    doc_metadata = doc[1]
            else:
                doc_content = str(doc)
            
            if not doc_content:
                print(f"--> [WARNING] Chunk {i} rỗng, bỏ qua.")
                continue

            try:
                if asyncio.iscoroutinefunction(self.llm.get_embedding):
                    vector = await self.llm.get_embedding(doc_content)
                else:
                    vector = self.llm.get_embedding(doc_content)
            except Exception as e:
                print(f"--> [ERROR] Lỗi Embedding chunk {i}: {e}")
                vector = None

            if not vector: continue

            final_meta = {
                "user_id": user_id,
                "source": file_id,
                "processed_at": processing_time
            }
            if team_id: final_meta["team_id"] = team_id
            
            if isinstance(doc_metadata, dict):
                final_meta.update(doc_metadata)

            ids.append(chunk_id)
            embeddings.append(vector)
            metadatas.append(final_meta)
            documents_content.append(doc_content)

            # chunk_payload = {
            #     "chunk_id": chunk_id,
            #     "content": doc_content,
            #     "metadata": final_meta
            # }
            # message_body = json.dumps(chunk_payload, default=str).encode('utf-8')
            # message = Message(
            #     body=message_body,
            #     content_type="application/json",
            # )
            # tasks.append(search_exchange.publish(message, routing_key=INDEX_DOCUMENT_CHUNK_ROUTING_KEY))
        collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
        collection = self._get_collection(collection_name)

        print(f"[VectorStore] Đang xóa dữ liệu cũ của file {file_id}...")
        try:
            collection.delete(where={"source": file_id})
        except Exception as e:
            print(f"Lỗi khi xóa (có thể là file mới): {e}")

        print(f"[VectorStore] Đang lưu {len(docs)} chunks vào ChromaDB...")
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents_content
        )
        
        print(f"[VectorStore] Đang gửi {len(tasks)} tin nhắn RabbitMQ...")
        if tasks:
            await asyncio.gather(*tasks)
            
        print(f"[VectorStore] Hoàn tất xử lý file: {file_id}")
        return doc
