import json
from aio_pika import IncomingMessage
from services.vectorstore_service import VectorStoreService
from services.minio_service import MinioService
from services.llm_service import LLMService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from config import (
    RESPONSE_QUEUE,
    NOTIFICATION_QUEUE
)

async def send_notification(channel, user_id, file_name, status, message):
    """
    Hàm trợ giúp để gửi tin nhắn thông báo (thành công/thất bại) về NestJS.
    """
    try:
        title = f"Process document {status}"
        notification_body = {
            "pattern": "notification.processDocument",
            "data": { "userId": user_id, "title": title, "message": message, "type": "SUCCESS" if status == "success" else "FAILED" }
        }
        await channel.basic_publish(
            body=json.dumps(notification_body).encode(),
            routing_key=NOTIFICATION_QUEUE
        )
        print(f"--> Đã gửi thông báo '{status}' cho file: {file_name}")
    except Exception as e:
        print(f"Lỗi khi gửi thông báo: {e}")

async def ingestion_callback(message: IncomingMessage, vectorstore_service: VectorStoreService):
    """
    Callback xử lý các tác vụ nạp dữ liệu (ingestion).
    """
    print(f"\n[INGESTION] Nhận được yêu cầu xử lý tài liệu mới...")
    user_id, file_name = None, None
    channel = message.channel
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            pattern = payload.get('pattern')
            if pattern != 'process_document':
                raise ValueError(f"Message pattern mismatch: expected 'process_document', got {pattern}")

            data = payload.get('data', {})
            user_id, file_name = data.get('userId'), data.get('fileName')

            if user_id and file_name:
                print(f"--> Bắt đầu xử lý file '{file_name}' cho user '{user_id}'.")
                await vectorstore_service.process_and_store(user_id, file_name)
                print(f"--> Xử lý file thành công!")
                
                original_name = file_name.split('-', 1)[1] if '-' in file_name else file_name
                await send_notification(channel, user_id, file_name, "success", f"Tài liệu '{original_name}' của bạn đã được xử lý thành công.")
            else:
                raise ValueError("Tin nhắn thiếu 'userId' hoặc 'fileName'.")
        except Exception as e:
            error_message = str(e)
            print(f"Lỗi khi xử lý tài liệu {file_name}: {error_message}")
            if user_id and file_name:
                await send_notification(channel, user_id, file_name, "failed", error_message)

async def action_callback(message: IncomingMessage, rag_chain: RAGChain, summarizer: Summarizer, minio_service: MinioService):
    """
    Callback xử lý các tác vụ tương tác (RAG, Summarize).
    """
    print(f"\n[ACTION] Nhận được yêu cầu tương tác mới...")
    socket_id, pattern, conversation_id = None, "unknown", None

    channel = message.channel
    
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            pattern = payload.get('pattern')
            data = payload.get('data', {})
            socket_id, user_id, conversation_id = data.get('socketId'), data.get('userId'), data.get('conversationId')

            if not all([socket_id, user_id, conversation_id]):
                raise ValueError("Tin nhắn thiếu socketId, userId, hoặc conversationId.")

            async def publish_response(content, type):
                response_body = {
                    "pattern": "rag_response",
                    "data": {"socketId": socket_id, "content": content, "type": type, "conversationId": conversation_id}
                }
                
                body = json.dumps(response_body).encode()
                print(f"--> [RAG] Gửi phần trị: {content}")
                await channel.basic_publish(body=body, routing_key=RESPONSE_QUEUE)
                
            if pattern == 'ask_question':
                question, chat_history = data.get('question'), data.get('chatHistory', [])
                if not question: raise ValueError("Tin nhắn thiếu 'question'.")
                
                print(f"--> [RAG] Câu hỏi từ user '{user_id}': {question}")
                async for chunk in rag_chain.ask_question_for_user(question, user_id, chat_history):
                    await publish_response(chunk, "chunk")

            elif pattern == 'summarize_document':
                file_name = data.get('fileName')
                if not file_name: raise ValueError("Tin nhắn thiếu 'fileName'.")

                print(f"--> [SUMMARIZE] Bắt đầu tóm tắt file '{file_name}' cho user '{user_id}'.")
                documents = await minio_service.load_documents(file_name)
                async for chunk in summarizer.summarize(documents):
                    await publish_response(chunk, "chunk")
            
            else:
                raise ValueError(f"Message pattern không xác định: '{pattern}'")

        except Exception as e:
            error_message = f"Error during processing '{pattern}': {e}"
            print(error_message)
            if socket_id:
                await publish_response(str(error_message), "error")
        
        finally:
            if socket_id:
                await publish_response("Stream has ended.", "end")
                print(f"--> Đã gửi tín hiệu kết thúc stream cho tác vụ '{pattern}'.")
