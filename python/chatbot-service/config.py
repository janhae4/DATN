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

INGESTION_QUEUE =       os.environ.get("INGESTION_QUEUE", "ingestion_queue")
RAG_QUEUE =             os.environ.get("RAG_QUEUE", "rag_queue")
SOCKET_QUEUE =          os.environ.get("SOCKET_QUEUE", "socket_queue")
THREADPOOL_MAX_WORKERS = int(os.environ.get("THREADPOOL_MAX_WORKERS", "6"))
