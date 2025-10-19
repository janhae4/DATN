from sentence_transformers.cross_encoder import CrossEncoder
from typing import Sequence
from langchain_core.documents import Document

class SentenceTransformerRerank:
    def __init__(self, model: CrossEncoder, top_n: int = 3):
        self.model = model
        self.top_n = top_n

    def compress_documents(self, documents: Sequence[Document], query: str, callbacks=None) -> Sequence[Document]:
        if not documents:
            return []
        pairs = [[query, d.page_content] for d in documents]
        scores = self.model.predict(pairs)
        sorted_pairs = sorted(zip(scores, documents), key=lambda x: x[0], reverse=True)
        return [doc for score, doc in sorted_pairs[: self.top_n]]
        
