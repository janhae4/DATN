import os
from dotenv import load_dotenv

# --- BƯỚC 1: NẠP BIẾN TỪ FILE RIÊNG ---
env_path = os.path.join(os.path.dirname(__file__), 'chatbot.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

# --- LẤY API KEY ---
SYSTEM_GEMINI_KEY = os.environ.get("TASKORA_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("AI_GEMINI_API_KEY")

# --- BƯỚC 2: XÓA SẠCH DẤU VẾT TRONG OS.ENVIRON ---
for key in list(os.environ.keys()):
    if "gemini" in key.lower():
        del os.environ[key]

# --- LOAD CONFIG ---
REDIS_HOST =        os.environ.get("REDIS_HOST", "localhost")
RABBITMQ_URL =      os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost/")
CHROMA_HOST =       os.environ.get("CHROMA_HOST", "localhost")
CHROMA_PORT =       int(os.environ.get("CHROMA_PORT", "8000"))

# --- MINIO ---
MINIO_ENDPOINT =    os.environ.get("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY =  os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY =  os.environ.get("MINIO_SECRET_KEY", "minioadmin")
MINIO_USE_SSL =     os.environ.get("MINIO_USE_SSL", "false").lower() in ("1","true","yes")
MINIO_BUCKET =      os.environ.get("MINIO_BUCKET_NAME", "documents")

# --- AI CONFIG ---
AI_GEMINI_API_KEY =    SYSTEM_GEMINI_KEY if SYSTEM_GEMINI_KEY else ""
GEMINI_MODEL =         "gemini-2.5-flash"
GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"

# --- INFRA ---
THREADPOOL_MAX_WORKERS = int(os.environ.get("THREADPOOL_MAX_WORKERS", "6"))
INGESTION_QUEUE = "ingestion_queue"
REMOVE_QUEUE = "remove_queue"
RAG_QUEUE = "rag_queue"
SUGGEST_QUEUE = "suggest_task_queue"
SEARCH_EXCHANGE = "search_exchange"

# --- EXCHANGES (Matching NestJS) ---
CHATBOT_EXCHANGE = "chatbot_exchange"
TASK_EXCHANGE = "task_exchange"
EVENTS_EXCHANGE = "events_exchange"
SOCKET_EXCHANGE = "socket_exchange"
FILE_EXCHANGE =     "file_exchange"
USER_EXCHANGE =     "user_exchange"

HANDLE_MESSAGE_ROUTING_KEY = "chatbot.handle_message"

ASK_QUESTION_ROUTING_KEY = "ask_question"
SUMMARIZE_DOCUMENT_ROUTING_KEY = "summarize_document"

SUGGEST_TASK_ROUTING_KEY = "task.suggestTask"

PROCESS_DOCUMENT_ROUTING_KEY = "process_document"
SUMMARIZE_MEETING_ROUTING_KEY = "summarize_meeting"
INDEX_DOCUMENT_CHUNK_ROUTING_KEY = "index.document.chunk"

REMOVE_TEAM_ROUTING_KEY = "events.remove.team"
DELETE_DOCUMENT_ROUTING_KEY = "events.delete.document"

STREAM_RESPONSE_ROUTING_KEY = "rag_response"
SEND_NOTIFICATION_ROUTING_KEY = "notification.send"
SEND_FILE_STATUS_ROUTING_KEY = "file.status"

GET_UNIQUE_SKILLS_ROUTING_KEY = "chatbot.get_unique_skills"
GET_BULK_SKILLS_ROUTING_KEY = "user.getBulkSkills"
