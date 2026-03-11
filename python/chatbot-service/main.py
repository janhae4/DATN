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
    REMOVE_TEAM_ROUTING_KEY,
    DELETE_DOCUMENT_ROUTING_KEY
)
from callback import ingestion_callback, action_callback, on_team_deleted, on_document_deleted
from services.gemini_service import GeminiService
from services.minio_service import MinioService
from services.vectorstore_service import VectorStoreService
from services.retriever_service import RetrieverService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from chains.task_architect import TaskArchitect
from models.reranker import FlashRankRerank

threadpool = ThreadPoolExecutor(max_workers=THREADPOOL_MAX_WORKERS)


async def main():
    print("Đang khởi tạo các service (Pure Gemini Mode)...")
    # Chúng ta chuyển hoàn toàn sang GeminiService để tiết kiệm RAM (xóa Ollama)
    gemini_service = GeminiService()
    minio_service = MinioService()
    vectorstore_service = VectorStoreService(gemini_service, minio_service) 

    reranker = None
    try:
        print("⚡ Đang tải FlashRank Reranker (ONNX)...")
        reranker = FlashRankRerank() 
        print("✅ Tải Reranker thành công!")
    except Exception as e:
        print(f"⚠️ Không load được FlashRank, sẽ chạy chế độ không Rerank: {e}")
        reranker = None

    retriever_service = RetrieverService(
        embeddings=gemini_service,
        use_reranker=(reranker is not None)
    )

    rag_chain = RAGChain(gemini_service, vectorstore_service, retriever_service, threadpool=threadpool)
    summarizer = Summarizer(gemini_service)
    suggest_summarizer = Summarizer(gemini_service)
    task_architect = TaskArchitect(gemini_service)
    
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

        delete_team_queue = await channel.declare_queue("delete_team_queue", durable=True)
        await delete_team_queue.bind(events_exchange, routing_key=REMOVE_TEAM_ROUTING_KEY)

        delete_doc_queue = await channel.declare_queue("delete_doc_queue", durable=True)
        await delete_doc_queue.bind(events_exchange, routing_key=DELETE_DOCUMENT_ROUTING_KEY)

        rag_queue = await channel.declare_queue(RAG_QUEUE, durable=True)
        await rag_queue.bind(chatbot_exchange, routing_key=ASK_QUESTION_ROUTING_KEY)
        await rag_queue.bind(chatbot_exchange, routing_key=SUMMARIZE_DOCUMENT_ROUTING_KEY)
        await rag_queue.bind(chatbot_exchange, routing_key=SUGGEST_TASK_ROUTING_KEY)

        suggest_queue = await channel.declare_queue(SUGGEST_QUEUE, durable=True)
        await suggest_queue.bind(chatbot_exchange, routing_key=SUGGEST_TASK_ROUTING_KEY)

        print(f"[*] Đang chờ tin nhắn từ RabbitMQ...")

        callback_with_services = partial(
            action_callback, 
            rag_chain=rag_chain, 
            summarizer=summarizer,
            suggest_summarizer=suggest_summarizer,
            task_architect=task_architect
        )
        await rag_queue.consume(callback_with_services)

        ingestion_callback_with_services = partial(
            ingestion_callback,
            vectorstore_service=vectorstore_service,
            search_exchange=search_exchange
        )
        await ingestion_queue.consume(ingestion_callback_with_services)

        await delete_team_queue.consume(partial(on_team_deleted, vectorstore_service=vectorstore_service))
        await delete_doc_queue.consume(partial(on_document_deleted, vectorstore_service=vectorstore_service))

        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
