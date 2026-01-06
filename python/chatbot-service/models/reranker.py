from sentence_transformers.cross_encoder import CrossEncoder
from typing import Sequence, List, Tuple
from langchain_core.documents import Document
from langchain.retrievers.document_compressors.base import BaseDocumentCompressor
from langchain_core.callbacks import Callbacks
import numpy as np 
class SentenceTransformerRerank(BaseDocumentCompressor):
    model: CrossEncoder
    top_n: int = 3
    
    class Config:
        """Configuration for this pydantic object."""
        arbitrary_types_allowed = True 
        
    def compress_documents(
        self,
        documents: Sequence[Document],
        query: str,
        callbacks: Callbacks = None,
    ) -> Sequence[Document]:
        """Compress documents using Sentence Transformer CrossEncoder, processing one by one."""
        if not documents:
            return []

        print(f"[Reranker] Reranking {len(documents)} documents for query: '{query[:50]}...'")
        
        scores: List[float] = []
        for doc in documents:
            pair = [[query, doc.page_content]]
            try:
                score = self.model.predict(pair)[0]
                scores.append(float(score))
            except Exception as e:
                print(f"[Reranker] Error predicting score for doc: {e}. Assigning low score.")
                scores.append(-np.inf)

        scored_documents: List[Tuple[float, Document]] = list(zip(scores, documents))
        sorted_documents = sorted(scored_documents, key=lambda x: x[0], reverse=True)

        print(f"[Reranker] Reranking complete. Top score: {sorted_documents[0][0] if sorted_documents else 'N/A'}")
        return [doc for score, doc in sorted_documents[: self.top_n]]