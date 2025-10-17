import os
import chromadb
import tempfile
import contextlib # Import mới để làm helper
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from typing import Generator
from minio import Minio

CHROMA_HOST = os.environ.get("CHROMA_HOST", "localhost")
CHROMA_PORT = os.environ.get("CHROMA_PORT", "8000")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

llm = ChatOllama(base_url=OLLAMA_BASE_URL, model="gemma3:4b")
embeddings = OllamaEmbeddings(base_url=OLLAMA_BASE_URL, model="nomic-embed-text")

client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

minio_client = Minio(
    os.environ.get("MINIO_ENDPOINT", "localhost:9000"),
    access_key=os.environ.get("MINIO_ACCESS_KEY", "minioadmin"),
    secret_key=os.environ.get("MINIO_SECRET_KEY", "minioadmin"),
    secure=os.environ.get("MINIO_USE_SSL", False)
)

BUCKET_NAME = os.environ.get("MINIO_BUCKET_NAME", "documents")

def get_user_collection_name(user_id: str) -> str:
    return f"user_{user_id}"

@contextlib.contextmanager
def _load_documents_from_minio(file_name: str):
    """
    Hàm helper: Tải file từ MinIO, lưu vào file tạm, load và trả về documents.
    Sử dụng @contextmanager để tự động dọn dẹp file tạm.
    """
    temp_file_path = None
    file_extension = os.path.splitext(file_name)[1].lower()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file_path = temp_file.name
        
        print(f"Đang tải file từ MinIO về: {temp_file_path}")
        minio_client.fget_object(BUCKET_NAME, file_name, temp_file_path)
        
        if file_extension == '.pdf':
            loader = PyPDFLoader(temp_file_path)
        elif file_extension in ['.txt', '.md', '.docx', '.doc']:
            loader = TextLoader(temp_file_path, encoding='utf-8')
        else:
            raise ValueError(f"Định dạng file '{file_extension}' không được hỗ trợ.")
        
        documents = loader.load()
        yield documents 
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print(f"Đã xóa file tạm: {temp_file_path}")

def process_and_store_documents(user_id: str, file_name: str):
    """
    Tải file, split, và lưu vào VectorDB (Chroma).
    """
    collection_name = get_user_collection_name(user_id)
    print(f"Đang xử lý file '{file_name}' cho collection '{collection_name}'...")
    try: 
        with _load_documents_from_minio(file_name) as documents:
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            docs = text_splitter.split_documents(documents)

            Chroma.from_documents(
                documents=docs,
                embedding=embeddings,
                client=client,
                collection_name=collection_name
            )
            print(f"Đã lưu thành công vào collection '{collection_name}'.")
            
    except Exception as e:
        print(f"Lỗi khi xử lý tài liệu: {e}")
        raise e 
    
def ask_question_for_user(question: str, user_id: str) -> Generator[str, None, None]:
    collection_name = get_user_collection_name(user_id)
    try:
        vectorstore = Chroma(
            client=client,
            collection_name=collection_name,
            embedding_function=embeddings,
        )
    except Exception as e:
        print(f"Không thể tải collection '{collection_name}': {e}")
        print("-> Chuyển sang chế độ chat thông thường (không RAG).") 
        prompt_template = "Bạn là một trợ lý AI hữu ích. Hãy trả lời câu hỏi sau: {input}"
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chat_chain = prompt | llm
        try:
            for chunk in chat_chain.stream({"input": question}):
                yield chunk.content 
        except Exception as e_chat:
            print(f"Đã xảy ra lỗi khi chat thông thường: {e_chat}")
            yield "Xin lỗi, đã có lỗi trong quá trình xử lý câu hỏi của bạn."
        return
    
    retriever = vectorstore.as_retriever()
    
    prompt_template = """
        Bạn là một trợ lý AI hữu ích. Hãy trả lời câu hỏi của người dùng.
        Nếu thông tin trong ngữ cảnh (context) dưới đây liên quan đến câu hỏi, hãy sử dụng thông tin đó để làm phong phú câu trả lời.
        Nếu ngữ cảnh không liên quan, hoặc câu hỏi là một lời chào/giao lưu, hãy trả lời câu hỏi bằng kiến thức của riêng bạn.

        Ngữ cảnh:
        <context>
        {context}
        </context>

        Câu hỏi: {input}
    """
    prompt = ChatPromptTemplate.from_template(prompt_template)
    
    document_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, document_chain)
    try:
        for chunk in rag_chain.stream({"input": question}):
            if "answer" in chunk:
                yield chunk["answer"]
    except Exception as e:
        print(f"Lỗi khi chạy RAG chain (Lỗi: {e}).")
        print("-> Chuyển sang chế độ chat thông thường (fallback).") 
        prompt_template = "Bạn là một trợ lý AI hữu ích. Hãy trả lời câu hỏi sau: {input}"
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chat_chain = prompt | llm
        try:
            for chunk in chat_chain.stream({"input": question}):
                yield chunk.content 
        except Exception as e_chat:
            print(f"Đã xảy ra lỗi khi chat thông thường: {e_chat}")
            yield "Xin lỗi, đã có lỗi trong quá trình xử lý câu hỏi của bạn."


def summarize_document(user_id: str, file_name: str) -> Generator[str, None, None]:
    """
    Tải file từ MinIO và stream tóm tắt nội dung.
    Sử dụng 'stuff' chain để có thể stream output.
    """
    print(f"Đang tóm tắt file '{file_name}' cho user '{user_id}'...")
    try:
        with _load_documents_from_minio(file_name) as documents:
            
            prompt_template = """
            Bạn là một trợ lý AI chuyên tóm tắt văn bản.
            Hãy viết một bản tóm tắt chi tiết và đầy đủ ý chính cho toàn bộ nội dung sau đây:

            Nội dung:
            "{context}"

            BẢN TÓM TẮT:
            """
            prompt = ChatPromptTemplate.from_template(prompt_template)

            summarize_chain = create_stuff_documents_chain(llm, prompt)

            print(f"Đang stream tóm tắt cho file: {file_name}")
            for chunk in summarize_chain.stream({"context": documents}):
                yield chunk
                        
    except Exception as e:
        print(f"Lỗi khi tóm tắt tài liệu: {e}")
        yield f"Xin lỗi, đã xảy ra lỗi khi tóm tắt tài liệu: {e}"