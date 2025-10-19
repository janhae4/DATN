from sentence_transformers.cross_encoder import CrossEncoder

class RetrieverService:
    def __init__(self, embeddings, reranker_model: CrossEncoder = None, use_reranker: bool = False, threadpool=None):
        self.embeddings = embeddings
        self.reranker_model = reranker_model
        self.use_reranker = use_reranker
        self.threadpool = threadpool

    async def build_compression_retriever(self, base_retriever):
        return base_retriever
