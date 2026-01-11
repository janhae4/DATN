import asyncio
from aio_pika import connect_robust, ExchangeType
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from config import (
    SEARCH_EXCHANGE,
    EVENTS_EXCHANGE,
    RABBITMQ_URL,
    SUGGEST_QUEUE,
    SUGGEST_TASK_ROUTING_KEY, 
    THREADPOOL_MAX_WORKERS,
    INGESTION_QUEUE,
    REMOVE_QUEUE,
    RAG_QUEUE,
    CHATBOT_EXCHANGE,
    ASK_QUESTION_ROUTING_KEY,
    SUMMARIZE_DOCUMENT_ROUTING_KEY,
    PROCESS_DOCUMENT_ROUTING_KEY,
    REMOVE_COLLECTION_ROUTING_KEY
)
from callback import ingestion_callback, action_callback, on_team_deleted
from services.llm_service import LLMService
from services.minio_service import MinioService
from services.vectorstore_service import VectorStoreService
from services.retriever_service import RetrieverService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from chains.task_architect import TaskArchitect
from models.reranker import FlashRankRerank

threadpool = ThreadPoolExecutor(max_workers=THREADPOOL_MAX_WORKERS)


async def main():
    print("Đang khởi tạo các service...")
    llm_service = LLMService()
    minio_service = MinioService()
    vectorstore_service = VectorStoreService(llm_service, minio_service) 

    reranker = None
    try:
        print("⚡ Đang tải FlashRank Reranker (ONNX)...")
        reranker = FlashRankRerank() 
        print("✅ Tải Reranker thành công!")
    except Exception as e:
        print(f"⚠️ Không load được FlashRank, sẽ chạy chế độ không Rerank: {e}")
        reranker = None

    retriever_service = RetrieverService(
        embeddings=llm_service,
        use_reranker=(reranker is not None)
    )

    rag_chain = RAGChain(llm_service, vectorstore_service, retriever_service, threadpool=threadpool)
    summarizer = Summarizer(llm_service)
    task_architect = TaskArchitect(llm_service)
    
    print("✅ Khởi tạo toàn bộ service hoàn tất.")

    connection = await connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        chatbot_exchange = await channel.declare_exchange(
            CHATBOT_EXCHANGE, 
            type= ExchangeType.DIRECT, 
            durable=True
        )
        
        search_exchange = await channel.declare_exchange(
            SEARCH_EXCHANGE,
            type=ExchangeType.DIRECT,
            durable=True
        )
        
        events_exchange = await channel.declare_exchange(
            EVENTS_EXCHANGE,
            type=ExchangeType.TOPIC,
            durable=True
        )

        ingestion_queue = await channel.declare_queue(INGESTION_QUEUE, durable=True)
        await ingestion_queue.bind(chatbot_exchange, routing_key=PROCESS_DOCUMENT_ROUTING_KEY)

        delete_queue = await channel.declare_queue(REMOVE_QUEUE, durable=True)
        await delete_queue.bind(events_exchange, routing_key=REMOVE_COLLECTION_ROUTING_KEY)

        rag_queue = await channel.declare_queue(RAG_QUEUE, durable=True)
        await rag_queue.bind(chatbot_exchange, routing_key=ASK_QUESTION_ROUTING_KEY)
        await rag_queue.bind(chatbot_exchange, routing_key=SUMMARIZE_DOCUMENT_ROUTING_KEY)
        await rag_queue.bind(chatbot_exchange, routing_key=SUGGEST_TASK_ROUTING_KEY)

        print("-- Kết nối RabbitMQ thành công, khởi tạo consumer...")

        ingestion_consumer = partial(
            ingestion_callback, 
            vectorstore_service=vectorstore_service, 
            channel=channel,
            search_exchange=search_exchange
        )
        action_consumer = partial(
            action_callback, 
            rag_chain=rag_chain, 
            summarizer=summarizer, 
            minio_service=minio_service,
            task_architect=task_architect,
            channel=channel
        )
        remove_consumer = partial(
            on_team_deleted, 
            vector_store=vectorstore_service,
        )

        await ingestion_queue.consume(ingestion_consumer)
        await rag_queue.consume(action_consumer)
        await delete_queue.consume(remove_consumer)
        
        print(f"[*] Đã kết nối tới RabbitMQ. Đang lắng nghe trên các hàng đợi:")
        print(f"  - {INGESTION_QUEUE} (Xử lý tài liệu)")
        print(f"  - {RAG_QUEUE} (Hỏi đáp & Tóm tắt)")
        print(f"  - {REMOVE_QUEUE} (Xóa collection)")
        print(f"  - {SUGGEST_QUEUE} (Gợi ý nhiệm vụ)")
        print(" [*] Bắt đầu lắng nghe. Để thoát, nhấn CTRL+C")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Đã dừng worker.")

