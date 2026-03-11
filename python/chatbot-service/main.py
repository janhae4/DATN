import os
import sys

for key in list(os.environ.keys()):
    if "gemini" in key.lower():
        print(f"--- [CLEANUP] Removing conflicting env var: {key}")
        del os.environ[key]

import asyncio
from aio_pika import connect_robust, ExchangeType
from concurrent.futures import ThreadPoolExecutor
from functools import partial

# Import các thành phần sau khi môi trường đã sạch
from config import (
    SEARCH_EXCHANGE, EVENTS_EXCHANGE, RABBITMQ_URL, SUGGEST_QUEUE,
    SUGGEST_TASK_ROUTING_KEY, THREADPOOL_MAX_WORKERS, INGESTION_QUEUE,
    RAG_QUEUE, CHATBOT_EXCHANGE, ASK_QUESTION_ROUTING_KEY,
    SUMMARIZE_DOCUMENT_ROUTING_KEY, PROCESS_DOCUMENT_ROUTING_KEY,
    REMOVE_QUEUE, REMOVE_TEAM_ROUTING_KEY, DELETE_DOCUMENT_ROUTING_KEY
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
    print("🚀 Khởi tạo Chatbot (Pure Gemini Mode - Ultra Light)...")
    
    # Khởi tạo các service
    gemini_service = GeminiService()
    minio_service = MinioService()
    vectorstore_service = VectorStoreService(gemini_service, minio_service) 

    reranker = None
    try:
        print("⚡ Đang tải Reranker (ONNX)...")
        reranker = FlashRankRerank() 
    except Exception as e:
        print(f"⚠️ Reranker error: {e}")

    retriever_service = RetrieverService(
        embeddings=gemini_service,
        use_reranker=(reranker is not None)
    )

    rag_chain = RAGChain(gemini_service, vectorstore_service, retriever_service, threadpool=threadpool)
    summarizer = Summarizer(gemini_service)
    task_architect = TaskArchitect(gemini_service)
    
    print("✅ Service khởi tạo xong.")

    connection = await connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        chatbot_exchange = await channel.declare_exchange(CHATBOT_EXCHANGE, type=ExchangeType.DIRECT, durable=True)
        search_exchange = await channel.declare_exchange(SEARCH_EXCHANGE, type=ExchangeType.DIRECT, durable=True)
        events_exchange = await channel.declare_exchange(EVENTS_EXCHANGE, type=ExchangeType.TOPIC, durable=True)

        # Queues setup
        rag_queue = await channel.declare_queue(RAG_QUEUE, durable=True)
        for rk in [ASK_QUESTION_ROUTING_KEY, SUMMARIZE_DOCUMENT_ROUTING_KEY, SUGGEST_TASK_ROUTING_KEY]:
            await rag_queue.bind(chatbot_exchange, routing_key=rk)

        ingestion_queue = await channel.declare_queue(INGESTION_QUEUE, durable=True)
        await ingestion_queue.bind(chatbot_exchange, routing_key=PROCESS_DOCUMENT_ROUTING_KEY)

        # Consumers
        await rag_queue.consume(partial(
            action_callback, 
            rag_chain=rag_chain, 
            summarizer=summarizer,
            suggest_summarizer=summarizer, 
            task_architect=task_architect,
            minio_service=minio_service,
            vectorstore_service=vectorstore_service,
            channel=channel
        ))

        await ingestion_queue.consume(partial(
            ingestion_callback,
            vectorstore_service=vectorstore_service,
            search_exchange=search_exchange,
            channel=channel
        ))

        # Task gợi ý
        suggest_queue = await channel.declare_queue(SUGGEST_QUEUE, durable=True)
        await suggest_queue.bind(chatbot_exchange, routing_key=SUGGEST_TASK_ROUTING_KEY)

        print(f"[*] Chatbot is ON and waiting for messages...")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
