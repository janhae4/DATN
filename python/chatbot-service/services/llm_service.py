from langchain_ollama import ChatOllama, OllamaEmbeddings
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_EMBEDDING_MODEL

class LLMService:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.llm = ChatOllama(base_url=base_url, model=model)
        self.embeddings = OllamaEmbeddings(model=OLLAMA_EMBEDDING_MODEL)

    def get_llm(self):
        return self.llm

    def get_embeddings(self):
        return self.embeddings
