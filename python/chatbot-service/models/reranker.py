from typing import Sequence
from langchain_core.documents import Document
from pydantic import PrivateAttr
from flashrank import Ranker, RerankRequest

class FlashRankRerank():
    model_name: str = "ms-marco-TinyBERT-L-2-v2"
    top_n: int = 3
    _ranker: object = PrivateAttr()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f"[Reranker] Loading FlashRank model: {self.model_name}...")
        self._ranker = Ranker(model_name=self.model_name)

    class Config:
        """Configuration for this pydantic object."""
        arbitrary_types_allowed = True 

    def compress_documents(
        self,
        documents: Sequence[Document],
        query: str,
    ) -> Sequence[Document]:
        if not documents:
            return []
        print(f"[Reranker] Reranking {len(documents)} documents using FlashRank...")
        passages = [
            {"id": str(i), "text": doc.page_content, "meta": doc.metadata}
            for i, doc in enumerate(documents)
        ]
        request = RerankRequest(query=query, passages=passages)
        results = self._ranker.rerank(request)

        final_docs = []
        for res in results[:self.top_n]:
            doc = Document(
                page_content=res["text"],
                metadata=res["meta"] if "meta" in res else {}
            )
            doc.metadata["rerank_score"] = res["score"]
            final_docs.append(doc)

        print(f"[Reranker] Done. Top score: {results[0]['score'] if results else 'N/A'}")
        return final_docs
