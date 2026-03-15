import os
import sys

for key in list(os.environ.keys()):
    if "gemini" in key.lower():
        del os.environ[key]

import asyncio
from aio_pika import connect_robust, ExchangeType
from concurrent.futures import ThreadPoolExecutor
from functools import partial

# Import config
from config import (
    SEARCH_EXCHANGE, EVENTS_EXCHANGE, RABBITMQ_URL, SUGGEST_QUEUE,
    SUGGEST_TASK_ROUTING_KEY, THREADPOOL_MAX_WORKERS, INGESTION_QUEUE,
    REMOVE_QUEUE, RAG_QUEUE, CHATBOT_EXCHANGE, ASK_QUESTION_ROUTING_KEY,
    SUMMARIZE_DOCUMENT_ROUTING_KEY, PROCESS_DOCUMENT_ROUTING_KEY,
    REMOVE_TEAM_ROUTING_KEY, DELETE_DOCUMENT_ROUTING_KEY,
    GET_UNIQUE_SKILLS_ROUTING_KEY, SUMMARIZE_MEETING_ROUTING_KEY
)
from callback import (
    ingestion_callback, action_callback, on_team_deleted, 
    on_document_deleted, audio_transcription_callback,
    get_unique_skills_callback, summarize_meeting_callback
)
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
    print("🚀 Khởi tạo Chatbot (Pure Gemini Mode - FIX CONSUMER)...")
    
    # Initialize services
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

        get_skills_queue = await channel.declare_queue("get_skills_queue", durable=True)
        await get_skills_queue.bind(chatbot_exchange, routing_key=GET_UNIQUE_SKILLS_ROUTING_KEY)

        summarize_meeting_queue = await channel.declare_queue("summarize_meeting_queue", durable=True)
        await summarize_meeting_queue.bind(chatbot_exchange, routing_key=SUMMARIZE_MEETING_ROUTING_KEY)

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
            suggest_summarizer=summarizer,
            minio_service=minio_service,
            task_architect=task_architect,
            vectorstore_service=vectorstore_service,
            channel=channel
        )
        remove_team_consumer = partial(
            on_team_deleted, 
            vector_store=vectorstore_service,
        )
        remove_doc_consumer = partial(
            on_document_deleted, 
            vector_store=vectorstore_service,
        )
        audio_transcription_consumer = partial(
            audio_transcription_callback,
            gemini_service=gemini_service,
            channel=channel
        )
        get_skills_consumer = partial(
            get_unique_skills_callback,
            channel=channel
        )
        summarize_meeting_consumer = partial(
            summarize_meeting_callback,
            gemini_service=gemini_service,
            channel=channel
        )

        await ingestion_queue.consume(ingestion_consumer)
        await rag_queue.consume(action_consumer)
        await delete_team_queue.consume(remove_team_consumer)
        await delete_doc_queue.consume(remove_doc_consumer)
        await get_skills_queue.consume(get_skills_consumer)
        await summarize_meeting_queue.consume(summarize_meeting_consumer)

        # Setup Audio Transcription Consumer
        video_chat_exchange = await channel.declare_exchange(
            "video_chat_exchange",
            type=ExchangeType.DIRECT,
            durable=True
        )
        audio_queue = await channel.declare_queue("audio_transcription_queue", durable=True)
        await audio_queue.bind(video_chat_exchange, routing_key="video_chat.audio.chunk")
        await audio_queue.consume(audio_transcription_consumer)
        
        print(f"[*] Đã kết nối tới RabbitMQ. Đang lắng nghe trên các hàng đợi:")
        print(f"  - {INGESTION_QUEUE} (Xử lý tài liệu)")
        print(f"  - {RAG_QUEUE} (Hỏi đáp & Tóm tắt)")
        print(f"  - delete_team_queue (Xóa toàn bộ collection)")
        print(f"  - delete_doc_queue (Xóa các tệp con riêng lẻ)")
        print(f"  - audio_transcription_queue (Chuyển giọng nói -> Văn bản)")
        print(f"  - {SUGGEST_QUEUE} (Gợi ý nhiệm vụ)")
        print(" [*] Bắt đầu lắng nghe. Để thoát, nhấn CTRL+C")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
