import os
import chromadb
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from typing import Generator

VECTORSTORE_PATH = "chroma_db"
OLLAMA_BASE_URL = "http://localhost:11434"

llm = ChatOllama(base_url=OLLAMA_BASE_URL, model="gemma3:1b")
embeddings = OllamaEmbeddings(base_url=OLLAMA_BASE_URL, model="nomic-embed-text")
client = chromadb.PersistentClient(path=VECTORSTORE_PATH)

def get_user_collection_name(user_id: str) -> str:
    return f"user_{user_id}"

def process_and_store_documents(user_id: str, file_path: str):
    collection_name = get_user_collection_name(user_id)
    print(f"Đang xử lý file '{file_path}' cho collection '{collection_name}'...")

    file_extension = os.path.splitext(file_path)[1].lower()

    if file_extension == '.pdf':
        loader = PyPDFLoader(file_path)
    elif file_extension in ['.txt', '.md', '.docx', '.doc']:
        loader = TextLoader(file_path, encoding='utf-8')
    else:
        print(f"Lỗi: Định dạng file '{file_extension}' không được hỗ trợ.")
        return

    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = text_splitter.split_documents(documents)

    Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        client=client,
        collection_name=collection_name
    )
    print(f"Đã lưu thành công vào collection '{collection_name}'.")

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
        yield "Tôi chưa có kiến thức nào về bạn. Vui lòng tải lên tài liệu trước."
        return
    
    retriever = vectorstore.as_retriever()
    
    prompt_template = """Chỉ sử dụng thông tin trong ngữ cảnh sau để trả lời câu hỏi. Nếu không biết câu trả lời, hãy nói rằng bạn không biết.

    <context>
    {context}
    </context>

    Câu hỏi: {input}"""
    prompt = ChatPromptTemplate.from_template(prompt_template)
    
    document_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, document_chain)
    try:
        for chunk in rag_chain.stream({"input": question}):
            if "answer" in chunk:
                yield chunk["answer"]
    except Exception as e:
        print(f"Đã xây ra lỗi: {e}")
        yield "Xin lỗi, đã có lỗi trong quá trình xử lý câu hỏi của bạn."