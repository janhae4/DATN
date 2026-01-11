import os
from minio import Minio
from config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL, MINIO_BUCKET
import tempfile
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader, UnstructuredPowerPointLoader
class MinioService:
    def __init__(self):
        self.client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=MINIO_USE_SSL)
        self.bucket = MINIO_BUCKET

    async def load_documents(self, object_name: str):
        """
        Tải file từ MinIO, lưu tạm, parse thành Document, rồi xóa file tạm.
        object_name: Chính là cái file_name/file_id mà bạn truyền vào.
        """
        print(f"--> [MinIO] Đang tải file: {object_name}")
        file_extension = os.path.splitext(object_name)[1].lower()
        
        documents = []

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            try:
                response = self.client.get_object(self.bucket, object_name)
                for d in response.stream(32*1024):
                    temp_file.write(d)
                response.close()
                response.release_conn()
                
                temp_file_path = temp_file.name
            except Exception as e:
                print(f"--> [MinIO] Lỗi khi tải file: {e}")
                return []

        try:
            print(f"--> [MinIO] Đang parse file tạm: {temp_file_path} ({file_extension})")
            
            if file_extension == ".pdf":
                loader = PyPDFLoader(temp_file_path)
                documents = loader.load()
                
            elif file_extension in [".docx", ".doc"]:
                loader = Docx2txtLoader(temp_file_path)
                documents = loader.load()
                
            elif file_extension == ".txt":
                loader = TextLoader(temp_file_path, encoding='utf-8')
                documents = loader.load()

            elif file_extension in [".pptx", ".ppt"]:
                loader = UnstructuredPowerPointLoader(temp_file_path)
                documents = loader.load()
                
            else:
                print(f"--> [MinIO] Định dạng {file_extension} chưa hỗ trợ tóm tắt.")
                documents = []

        except Exception as e:
            print(f"--> [MinIO] Lỗi khi parse document: {e}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                print(f"--> [MinIO] Đã xóa file tạm.")

        for doc in documents:
            doc.metadata['source'] = object_name
            doc.metadata['file_name'] = object_name

        return documents
    