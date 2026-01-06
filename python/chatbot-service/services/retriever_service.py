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
