import chromadb
from config import CHROMA_HOST, CHROMA_PORT
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from services.minio_service import MinioService
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

    async def persist_documents(self, collection_name: str, documents):
        def _persist():
            Chroma.from_documents(
                documents=documents,
                embedding=self.embeddings,
                client=self.client,
                collection_name=collection_name
            )
        await asyncio.to_thread(_persist)
        
    async def process_and_store(self, user_id: str, file_path: str):
        print(f"[VectorStore] Đang tải file: {file_path}")
        raw_docs = await self.minio.load_documents(file_path)
        if not raw_docs:
            print(f"[VectorStore] Không tải được tài liệu hoặc tài liệu rỗng: {file_path}")
            return

        print(f"[VectorStore] Đã tải {len(raw_docs)} tài liệu. Đang tách...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(raw_docs)

        print(f"[VectorStore] Đã tách thành {len(docs)} phần. Đang cập nhật metadata...")
        for doc in docs:
            doc.metadata["user_id"] = user_id
            doc.metadata["source"] = file_path 
            
        collection_name = f"user_{user_id}"
        print(f"[VectorStore] Đang lưu {len(docs)} phần vào collection: {collection_name}")
        await self.persist_documents(collection_name, docs)
        print(f"[VectorStore] Đã lưu thành công.")