import tempfile, os
from minio import Minio
from typing import Generator, List
from langchain_community.document_loaders import PyPDFLoader, TextLoader

def load_from_minio(minio_client: Minio, bucket: str, file_name: str) -> Generator[List, None, None]:
    """
    Sync loader — returns documents list (langchain Document objects).
    Caller should run in thread if needed.
    """
    temp_file_path = None
    ext = os.path.splitext(file_name)[1].lower()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            temp_file_path = tmp.name
        minio_client.fget_object(bucket, file_name, temp_file_path)
        if ext == ".pdf":
            loader = PyPDFLoader(temp_file_path)
        elif ext in (".txt", ".md", ".docx", ".doc"):
            loader = TextLoader(temp_file_path, encoding="utf-8")
        else:
            raise ValueError(f"Unsupported extension: {ext}")
        docs = loader.load()
        return docs
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
