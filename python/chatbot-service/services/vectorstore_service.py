from datetime import datetime
import json
import os
import chromadb
from config import CHROMA_HOST, CHROMA_PORT
from langchain_chroma.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.minio_service import MinioService
from aio_pika import Channel, Message, Exchange
from config import INDEX_DOCUMENT_CHUNK_ROUTING_KEY
import asyncio


class VectorStoreService:
    def __init__(self, embedding_function, minio: MinioService):
        self.client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        self.minio = minio
        self.embeddings = embedding_function

    async def get_collection(self, collection_name: str, embedding_function=None):
        embed_func = embedding_function if embedding_function else self.embeddings
        return Chroma(
            client=self.client, 
            collection_name=collection_name,
            embedding_function=embed_func
        )
    
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
            
    async def persist_documents(self, collection_name: str, documents):
        def _persist():
            Chroma.from_documents(
                documents=documents,
                embedding=self.embeddings,
                client=self.client,
                collection_name=collection_name
            )
        await asyncio.to_thread(_persist)
        
    async def process_and_store(
        self, 
        user_id: str, 
        file_id: str,
        storage_key: str, 
        original_name: str, 
        channel: Channel,
        search_exchange= Exchange,
        team_id: str | None = None,
        ):
        print(f"[VectorStore] Đang tải file: {storage_key}")
        raw_docs = await self.minio.load_documents(storage_key)
        
        if not raw_docs:
            print(f"[VectorStore] Không tải được tài liệu hoặc tài liệu rỗng: {original_name}")
            return

        print(f"[VectorStore] Đã tải {len(raw_docs)} tài liệu. Đang tách...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        
        docs = text_splitter.split_documents(raw_docs)

        print(f"[VectorStore] Đã tách thành {len(docs)} phần. Đang cập nhật metadata...")

        processing_time = datetime.utcnow().isoformat()
        for doc in docs:
            doc.metadata.update({
                "user_id": user_id,
                "source": file_id,       
                "file_name": original_name,
                "processed_at": processing_time
            })
            
            if team_id:
                doc.metadata["team_id"] = team_id
            
        collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
        
        await self.delete_documents_by_source(collection_name, file_id)
        
        print(f"[VectorStore] Đang lưu {len(docs)} phần vào collection: {collection_name}")
        await self.persist_documents(collection_name, docs)
        print(f"[VectorStore] Đã lưu thành công {len(docs)} phần vào collection: {collection_name}")
        
        print(f"[VectorStore] Đã lưu vector. Đang gửi {len(docs)} chunks để index...")
        tasks = []
        for i, doc in enumerate(docs):
            chunk_payload = {
                "chunk_id": f"{file_id}_{i}",
                "content": doc.page_content,
                "metadata": doc.metadata
            }
            message_body = json.dumps(chunk_payload).encode('utf-8')
            message = Message(
                body=message_body,
                content_type="application/json",
            )
            tasks.append(
                search_exchange.publish(message, routing_key=INDEX_DOCUMENT_CHUNK_ROUTING_KEY)
            )
        
        await asyncio.gather(*tasks)
        print(f"[VectorStore] Đã gửi {len(docs)} chunks để index thành công.")