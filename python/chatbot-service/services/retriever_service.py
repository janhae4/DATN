from flashrank import Ranker, RerankRequest

class RetrieverService:
    def __init__(self, embeddings, use_reranker: bool = False):
        self.embeddings = embeddings
        self.use_reranker = use_reranker
        
        if self.use_reranker:
            print("🛠️ Loading FlashRank (Lightweight Reranker)...")
            self.ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2")

    async def rerank_documents(self, query, documents):
        """
        documents: List of Langchain Document objects OR list of dicts with 'page_content'
        """
        if not self.use_reranker or not documents:
            return documents

        print(f"[Reranker] Reranking {len(documents)} docs...")

        passages = []
        for i, doc in enumerate(documents):
            content = doc.page_content if hasattr(doc, "page_content") else doc.get("content", "")
            meta = doc.metadata if hasattr(doc, "metadata") else doc.get("metadata", {})
            
            passages.append({
                "id": str(i),
                "text": content,
                "meta": meta
            })
        request = RerankRequest(query=query, passages=passages)
        results = self.ranker.rerank(request)
        return results