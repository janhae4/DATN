from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_EMBEDDING_MODEL
import ollama

class LLMService:
    def __init__(self):
        self.client = ollama.Client(host=OLLAMA_BASE_URL)

    def get_embedding(self, text: str):
        response = self.client.embeddings(model=OLLAMA_EMBEDDING_MODEL, prompt=text)
        return response['embedding']

    def chat(self, messages):
        return self.client.chat(model=OLLAMA_MODEL, messages=messages, stream=True)
    
    def chatWithOutStream(self, messages):
        return self.client.chat(model=OLLAMA_MODEL, messages=messages)
