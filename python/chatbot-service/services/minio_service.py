from minio import Minio
from config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL, MINIO_BUCKET
import asyncio
from utils.file_uploader import load_from_minio

class MinioService:
    def __init__(self):
        self.client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=MINIO_USE_SSL)
        self.bucket = MINIO_BUCKET

    async def load_documents(self, file_name: str):
        docs = await asyncio.to_thread(load_from_minio, self.client, self.bucket, file_name)
        return docs
    