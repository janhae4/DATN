import os
from minio import Minio
from config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL, MINIO_BUCKET
import tempfile
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    UnstructuredPowerPointLoader,
    CSVLoader,
)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".pptx", ".ppt", ".csv"}


class MinioService:
    def __init__(self):
        self.client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_USE_SSL,
        )
        self.bucket = MINIO_BUCKET

    async def load_documents(self, object_name: str):
        """
        Tải file từ MinIO, lưu tạm, parse thành Documents (LangChain), rồi xóa file tạm.
        object_name: storageKey (UUID + extension) của file trong MinIO.
        Raises RuntimeError / ValueError nếu file không thể load hoặc không hỗ trợ.
        """
        print(f"--> [MinIO] Đang tải file: {object_name}")
        file_extension = os.path.splitext(object_name)[1].lower()

        if file_extension not in SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Định dạng '{file_extension}' không được hỗ trợ. "
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
            doc.metadata["file_name"] = object_name

        print(f"--> [MinIO] Parse xong: {len(documents)} documents từ '{object_name}'")
        return documents