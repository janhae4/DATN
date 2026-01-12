<<<<<<< HEAD
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
        print(f"[Reranker] Done. Top score: {results[0]['score'] if results else 'N/A'}")
        return results
=======
from sentence_transformers.cross_encoder import CrossEncoder
from langchain_classic.retrievers import ContextualCompressionRetriever
from models.reranker import SentenceTransformerRerank
class RetrieverService:
    def __init__(self, embeddings, reranker_model: CrossEncoder = None, use_reranker: bool = False, threadpool=None):
        self.embeddings = embeddings
        self.reranker_model = reranker_model
        self.use_reranker = use_reranker
        self.threadpool = threadpool

    async def build_compression_retriever(self, base_retriever):
        if self.use_reranker and self.reranker_model:
            print("🛠️ Building ContextualCompressionRetriever with Reranker...")
            compressor = SentenceTransformerRerank(
                model=self.reranker_model, 
                top_n=3
            )
            compression_retriever = ContextualCompressionRetriever(
                base_compressor=compressor, 
                base_retriever=base_retriever
            )
            return compression_retriever
        else:
            print(" Reranker not enabled, using base retriever.")
            return base_retriever
>>>>>>> origin/blank_branch
