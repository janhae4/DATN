import json
from aio_pika import IncomingMessage, Channel, Message
from services.vectorstore_service import VectorStoreService
from services.minio_service import MinioService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from config import (
    EVENTS_EXCHANGE,
    ASK_QUESTION_ROUTING_KEY,
    SEND_NOTIFICATION_ROUTING_KEY,
    SUMMARIZE_DOCUMENT_ROUTING_KEY,
    STREAM_RESPONSE_ROUTING_KEY,
    SOCKET_EXCHANGE
)

async def send_notification(channel: Channel, user_id, file_name, status, message):
    """
    Hàm trợ giúp để gửi tin nhắn thông báo (thành công/thất bại) về NestJS.
    """
    try:
        title = f"Process document {status}"
        notification_body = { 
            "userId": user_id, 
            "title": title, 
            "message": message, 
            "type": "SUCCESS" if status == "success" else "FAILED" 
        }
        socket = await channel.get_exchange(SOCKET_EXCHANGE)
        await socket.publish(
            message=Message(json.dumps(notification_body).encode()),
            routing_key=SEND_NOTIFICATION_ROUTING_KEY
        )
        print(f"--> Đã gửi thông báo '{status}' cho file: {file_name}")
    except Exception as e:
        print(f"Lỗi khi gửi thông báo: {e}")

async def ingestion_callback(message: IncomingMessage, vectorstore_service: VectorStoreService, channel: Channel):
    """
    Callback xử lý các tác vụ nạp dữ liệu (ingestion).
    """
    print(f"\n[INGESTION] Nhận được yêu cầu xử lý tài liệu mới...")
    user_id, file_name = None, None
    
    async with message.process():
        try:
            payload_dto = json.loads(message.body.decode())
            print(f"--> Payload DTO nhận được: {payload_dto}")

            user_id = payload_dto.get('userId')
            file_name = payload_dto.get('fileName')
            team_id = payload_dto.get('teamId')
        
            if user_id and file_name:
                print(f"--> Bắt đầu xử lý file '{file_name}' cho user '{user_id}'.")
                await vectorstore_service.process_and_store(user_id, file_name, team_id)
                print(f"--> Xử lý file thành công!")

                original_name = file_name.split('-', 1)[1] if '-' in file_name else file_name
                await send_notification(channel, user_id, file_name, "success", f"File '{original_name}' had been processed successfully.")
            else:
                raise ValueError("Missing user_id or file_name.")
        except Exception as e:
            error_message = str(e)
            print(f"Error processing '{file_name}': {error_message}")
            if user_id and file_name:
                await send_notification(channel, user_id, file_name, "failed", error_message)

async def action_callback(message: IncomingMessage, rag_chain: RAGChain, summarizer: Summarizer, minio_service: MinioService, channel: Channel):
    """
    Callback xử lý các tác vụ tương tác (RAG, Summarize).
    """
    print(f"\n[ACTION] Nhận được yêu cầu tương tác mới...")
    socket_id, user_id, conversation_id = None, None, None
    pattern_from_key = "unknown"
    print(message)
    
    actual_routing_key = message.routing_key
    print(f"--> Nhận message với routing key: {actual_routing_key}")

    if actual_routing_key == ASK_QUESTION_ROUTING_KEY:
        pattern_from_key = "ask_question"
    elif actual_routing_key == SUMMARIZE_DOCUMENT_ROUTING_KEY:
        pattern_from_key = "summarize_document"
    
    async with message.process():
        retrieved_metadata = None
        try:
            payload_dto = json.loads(message.body.decode())
            print(f"--> Payload DTO nhận được: {payload_dto}")

            socket_id = payload_dto.get('socketId')
            user_id = payload_dto.get('userId')
            conversation_id = payload_dto.get('conversationId')
            team_id = payload_dto.get('teamId')

            if not all([socket_id, user_id, conversation_id]):
                raise ValueError("Tin nhắn thiếu socketId, userId, hoặc conversationId.")

            async def publish_response(content, type, metadata = None, team_id = None):
                response_dto = {
                    "socketId": socket_id,
                    "content": content,
                    "type": type,
                    "conversationId": conversation_id,
                    "teamId": team_id,
                    "metadata": metadata if metadata else {}
                }
                message_body = Message(
                    body=json.dumps(response_dto).encode()
                )
                
                print(f"--> [Py->Nest] Gửi về ({type}): {content}...")
                
                events_exchange = await channel.get_exchange(EVENTS_EXCHANGE)
                await events_exchange.publish(
                    message_body,
                    routing_key=STREAM_RESPONSE_ROUTING_KEY
                )
                
            if pattern_from_key == 'ask_question':
                    question = payload_dto.get('question')
                    chat_history = payload_dto.get('chatHistory', [])
                    if not question: raise ValueError("Tin nhắn thiếu 'question'.")

                    print(f"--> [RAG] Câu hỏi từ user '{user_id}': {question}")
                    await publish_response("Thinking...", "start", team_id=team_id)
                    async for chunk in rag_chain.ask_question_for_user(question, user_id, team_id, chat_history):
                        await publish_response(chunk, "chunk", team_id=team_id)
                    retrieved_metadata = rag_chain.get_last_retrieved_context()
                    print(f"--> [RAG] Đã lấy được metadata: {retrieved_metadata}")

            elif pattern_from_key == 'summarize_document':
                file_name = payload_dto.get('fileName')
                if not file_name: raise ValueError("Tin nhắn thiếu 'fileName'.")
                await publish_response("Summarizing...", "start", team_id=team_id)
                print(f"--> [SUMMARIZE] Bắt đầu tóm tắt file '{file_name}' cho user '{user_id}'.")
                documents = await minio_service.load_documents(file_name)
                async for chunk in summarizer.summarize(documents):
                    await publish_response(chunk, "chunk", team_id=team_id)
                    
            else:
                raise ValueError(f"Routing key không xác định: '{actual_routing_key}'")

        except Exception as e:
            error_message = f"Lỗi khi xử lý '{pattern_from_key}': {e}"
            if socket_id:
                error_metadata = {"error": str(error_message)}
                await publish_response(str(error_message), "error", error_metadata, team_id)

        finally:
            if socket_id:
                await publish_response("Stream has ended.", "end", retrieved_metadata, team_id)
                print(f"--> Đã gửi tín hiệu kết thúc stream cho tác vụ '{pattern_from_key}'.")
                
async def on_team_deleted(message: IncomingMessage, vector_store: VectorStoreService):
    """
    Callback lắng nghe sự kiện xóa team từ NestJS và xóa collection 
    tương ứng trong ChromaDB.
    """
    print(f"\n[DELETE] Nhận được yêu cầu xóa dữ liệu team...")
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            team_id = payload.get('teamId')
            
            if not team_id:
                print(f"[DELETE] Lỗi: Payload nhận được không có teamId.")
                return 
            
            collection_name = f"team_{team_id}" 
            
            print(f"[DELETE] Đang xóa collection: {collection_name}")
            
            await vector_store.delete_collection(collection_name)
            
            print(f"[DELETE] Đã xóa thành công collection: {collection_name}")
            
        except Exception as e:
            print(f"[DELETE] Lỗi nghiêm trọng khi xóa collection {collection_name}: {e}")