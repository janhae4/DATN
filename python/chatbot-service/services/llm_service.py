from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_EMBEDDING_MODEL
import ollama
from utils_retry import retry_sync

class LLMService:
    def __init__(self):
        self.client = ollama.Client(host=OLLAMA_BASE_URL)

    @retry_sync(max_retries=3, delay=1, backoff=2)
    def get_embedding(self, text: str):
        response = self.client.embeddings(model=OLLAMA_EMBEDDING_MODEL, prompt=text)
        return response['embedding']

    @retry_sync(max_retries=3, delay=2, backoff=2)
    def chat(self, messages):
        return self.client.chat(model=OLLAMA_MODEL, messages=messages, stream=True)
    
    @retry_sync(max_retries=3, delay=2, backoff=2)
    def chatWithOutStream(self, messages):
        return self.client.chat(model=OLLAMA_MODEL, messages=messages)
