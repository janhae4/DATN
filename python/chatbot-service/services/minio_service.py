import os
import mimetypes
from minio import Minio
from config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL, MINIO_BUCKET
import tempfile
from utils_retry import retry_async
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    UnstructuredPowerPointLoader,
    UnstructuredExcelLoader,
    CSVLoader,
)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".pptx", ".ppt", ".csv", ".xlsx", ".xls"}

# Map CONTENT-TYPE to EXTENSION if extension is missing
MIME_MAP = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "text/plain": ".txt",
    "text/markdown": ".md",
    "text/x-markdown": ".md",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.ms-powerpoint": ".ppt",
    "text/csv": ".csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
}

class MinioService:
    def __init__(self):
        self.client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_USE_SSL,
        )
        self.bucket = MINIO_BUCKET

    @retry_async(max_retries=3, delay=1, backoff=2)
    async def load_documents(self, object_name: str, original_name: str = None):
        """
        Tải file từ MinIO, lưu tạm, parse thành Documents (LangChain), rồi xóa file tạm.
        object_name: storageKey (UUID + extension) của file trong MinIO.
        original_name: Tên gốc của file (Dùng làm metadata).
        """
        print(f"--> [MinIO] Đang tải file: {object_name}")
        
        # 1. Xác định extension
        file_extension = os.path.splitext(object_name)[1].lower()
        
        # Nếu storageKey không có extension, lấy từ MinIO metadata (stat_object)
        if not file_extension:
            try:
                stat = self.client.stat_object(self.bucket, object_name)
                content_type = stat.content_type
                file_extension = MIME_MAP.get(content_type)
                if not file_extension:
                    file_extension = mimetypes.guess_extension(content_type)
                
                print(f"--> [MinIO] Detected content-type: {content_type} -> extension: {file_extension}")
            except Exception as e:
                print(f"--> [MinIO] Không thể stat object để lấy content-type: {e}")

        # 2. Fallback cuối cùng sang original_name nếu vẫn không thấy extension
        if not file_extension and original_name:
            file_extension = os.path.splitext(original_name)[1].lower()
            print(f"--> [MinIO] Fallback extension từ original_name: {file_extension}")

        if not file_extension or file_extension not in SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Định dạng '{file_extension}' của file '{original_name or object_name}' không được hỗ trợ. "
                f"Hỗ trợ: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            )

        documents = []
        temp_file_path = None

        # ── Tải file từ MinIO vào file tạm ──────────────────────────────────────
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            temp_file_path = tmp.name
            try:
                response = self.client.get_object(self.bucket, object_name)
                for chunk in response.stream(32 * 1024):
                    tmp.write(chunk)
                response.close()
                response.release_conn()
            except Exception as e:
                print(f"--> [MinIO] Lỗi khi tải file từ MinIO: {e}")
                if temp_file_path and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise RuntimeError(f"Không thể tải file '{object_name}' từ MinIO: {e}")

        # ── Parse nội dung ────────────────────────────────────────────────────────
        try:
            print(f"--> [MinIO] Parse file tạm: {temp_file_path} ({file_extension})")

            if file_extension == ".pdf":
                loader = PyPDFLoader(temp_file_path)
                documents = loader.load()

            elif file_extension in [".docx", ".doc"]:
                loader = Docx2txtLoader(temp_file_path)
                documents = loader.load()

            elif file_extension in [".txt", ".md"]:
                loader = TextLoader(temp_file_path, encoding="utf-8")
                documents = loader.load()

            elif file_extension == ".csv":
                loader = CSVLoader(temp_file_path, encoding="utf-8")
                documents = loader.load()

            elif file_extension in [".pptx", ".ppt"]:
                loader = UnstructuredPowerPointLoader(temp_file_path)
                documents = loader.load()

            elif file_extension in [".xlsx", ".xls"]:
                loader = UnstructuredExcelLoader(temp_file_path)
                documents = loader.load()

        except Exception as e:
            print(f"--> [MinIO] Lỗi khi parse document: {e}")
            raise RuntimeError(f"Không thể đọc nội dung file '{object_name}': {e}")
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                print(f"--> [MinIO] Đã xóa file tạm.")

        if not documents:
            raise ValueError(f"File '{object_name}' không có nội dung hợp lệ để xử lý.")

        for doc in documents:
            doc.metadata["source"] = object_name
            doc.metadata["file_name"] = original_name or object_name

        print(f"--> [MinIO] Parse xong: {len(documents)} documents từ '{object_name}'")
        return documents