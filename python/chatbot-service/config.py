import os

RABBITMQ_URL =      os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost/")
RABBITMQ_QUEUE =    os.environ.get("RABBITMQ_QUEUE", "rag_requests")
OLLAMA_BASE_URL =   os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL =      os.environ.get("OLLAMA_MODEL", "gemma3:4b")
OLLAMA_EMBEDDING_MODEL = os.environ.get("OLLAMA_EMBEDDING_MODEL", "siv/Qwen3-Embedding-0.6B-GGUF:f16")
CHROMA_HOST =       os.environ.get("CHROMA_HOST", "localhost")
CHROMA_PORT =       int(os.environ.get("CHROMA_PORT", "8000"))
MINIO_ENDPOINT =    os.environ.get("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY =  os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY =  os.environ.get("MINIO_SECRET_KEY", "minioadmin")
MINIO_USE_SSL =     os.environ.get("MINIO_USE_SSL", "false").lower() in ("1","true","yes")
MINIO_BUCKET =      os.environ.get("MINIO_BUCKET_NAME", "documents")

THREADPOOL_MAX_WORKERS = int(os.environ.get("THREADPOOL_MAX_WORKERS", "6"))

INGESTION_QUEUE = "ingestion_queue"
REMOVE_QUEUE = "remove_queue"
RAG_QUEUE = "rag_queue"

CHATBOT_EXCHANGE = os.getenv("CHATBOT_EXCHANGE", "chatbot_exchange")
ASK_QUESTION_ROUTING_KEY = os.getenv("ASK_QUESTION_ROUTING_KEY", "ask_question")
SUMMARIZE_DOCUMENT_ROUTING_KEY = os.getenv("SUMMARIZE_DOCUMENT_ROUTING_KEY", "summarize_document")
SOCKET_EXCHANGE = os.getenv("SOCKET_EXCHANGE", "socket_exchange")
EVENTS_EXCHANGE = os.getenv("EVENTS_EXCHANGE", "events_exchange")
STREAM_RESPONSE_ROUTING_KEY = os.getenv("STREAM_RESPONSE_ROUTING_KEY", "rag_response")
REMOVE_COLLECTION_ROUTING_KEY = os.getenv("REMOVE_COLLECTION_ROUTING_KEY", "chatbot.remove_collection")
SEND_NOTIFICATION_ROUTING_KEY = os.getenv("SEND_NOTIFICATION_ROUTING_KEY", "notification.send")
PROCESS_DOCUMENT_ROUTING_KEY = os.getenv("PROCESS_DOCUMENT_ROUTING_KEY", "process_document")
