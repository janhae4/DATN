import asyncio
from aio_pika import connect_robust
from concurrent.futures import ThreadPoolExecutor

from config import (
    RABBITMQ_URL, 
    THREADPOOL_MAX_WORKERS,
    INGESTION_QUEUE, 
    RAG_QUEUE,
)
from callback import ingestion_callback, action_callback
from services.llm_service import LLMService
from services.minio_service import MinioService
from services.vectorstore_service import VectorStoreService
from services.retriever_service import RetrieverService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from sentence_transformers.cross_encoder import CrossEncoder

threadpool = ThreadPoolExecutor(max_workers=THREADPOOL_MAX_WORKERS)


async def main():
    print("Đang khởi tạo các service...")
    llm_service = LLMService()
    minio_service = MinioService()
    vectorstore_service = VectorStoreService(llm_service.get_embeddings(), minio_service) 

    reranker = None
    try:
        loop = asyncio.get_running_loop()
        print("Đang tải Reranker model...")
        from functools import partial
        constructor_call = partial(CrossEncoder, "Qwen/Qwen3-Reranker-0.6B", max_length=512)
        reranker = await loop.run_in_executor(threadpool, constructor_call)
        print("Tải Reranker thành công!")
    except Exception as e:
        print(f"Không load được reranker, sẽ dùng fallback: {e}")
        reranker = None

    retriever_service = RetrieverService(llm_service.get_embeddings(), reranker_model=reranker, use_reranker=(reranker is not None))
    rag_chain = RAGChain(llm_service, vectorstore_service, retriever_service, threadpool=threadpool)
    summarizer = Summarizer(llm_service)
    print("Khởi tạo service hoàn tất.")

    connection = await connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        ingestion_queue = await channel.declare_queue(INGESTION_QUEUE, durable=True)
        rag_queue = await channel.declare_queue(RAG_QUEUE, durable=True)

        print(f"[*] Đã kết nối tới RabbitMQ. Đang lắng nghe trên các hàng đợi:")
        print(f"  - {INGESTION_QUEUE} (Xử lý tài liệu)")
        print(f"  - {RAG_QUEUE} (Hỏi đáp & Tóm tắt)")

        from functools import partial
        ingestion_consumer = partial(ingestion_callback, vectorstore_service=vectorstore_service)
        action_consumer = partial(action_callback, rag_chain=rag_chain, summarizer=summarizer, minio_service=minio_service)

        await ingestion_queue.consume(ingestion_consumer)
        await rag_queue.consume(action_consumer)

        print(" [*] Bắt đầu lắng nghe. Để thoát, nhấn CTRL+C")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Đã dừng worker.")

