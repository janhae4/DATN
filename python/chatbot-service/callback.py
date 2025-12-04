import json
import re
from aio_pika import Exchange, IncomingMessage, Channel, Message
from services.vectorstore_service import VectorStoreService
from services.minio_service import MinioService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from config import (
    EVENTS_EXCHANGE,
    ASK_QUESTION_ROUTING_KEY,
    SEND_FILE_STATUS_ROUTING_KEY,
    SEND_NOTIFICATION_ROUTING_KEY,
    SUMMARIZE_DOCUMENT_ROUTING_KEY,
    SUMMARIZE_MEETING_ROUTING_KEY,
    STREAM_RESPONSE_ROUTING_KEY,
    RESPONSE_SUMMARIZE_MEETING_ROUTING_KEY,
    SOCKET_EXCHANGE
)

async def publish_response(
    channel: Channel, 
    socket_id: str, 
    discussion_id: str,
    content: str, 
    type: str, 
    team_id: str = None, 
    metadata: dict = None, 
    membersToNotify: list = []
):
    """
    Hàm helper để gửi DTO phản hồi về cho NestJS (SocketGateway).
    """
    response_dto = {
        "socketId": socket_id,
        "content": content,
        "type": type,
        "discussionId": discussion_id,
        "teamId": team_id,
        "metadata": metadata if metadata else {},
        "membersToNotify": membersToNotify
    }
    message_body = Message(
        body=json.dumps(response_dto).encode()
    )
    
    print(f"--> [Py->Nest] Gửi về ({type}): {content[:50]}...")
    
    events_exchange = await channel.get_exchange(EVENTS_EXCHANGE)
    await events_exchange.publish(
        message_body,
        routing_key=STREAM_RESPONSE_ROUTING_KEY
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

async def send_summarize_meeting_response(
    channel: Channel, 
    room_id: str, 
    content: str, 
    status: str,
    metadata: dict = None
):
    """
    Gửi stream chunk về cho một Room cụ thể.
    """
    try:
        payload = {
            "roomId": room_id, 
            "data": {
                "content": content,
                "status": status,
                "metadata": metadata or {}
            }
        }

        message_body = Message(
            body=json.dumps(payload).encode(),
            content_type="application/json"
        )

        socket_exchange = await channel.get_exchange(SOCKET_EXCHANGE)
        
        await socket_exchange.publish(
            message_body,
            routing_key=RESPONSE_SUMMARIZE_MEETING_ROUTING_KEY
        )
        
    except Exception as e:
        print(f"Lỗi khi gửi meeting response: {e}")
    
async def handle_meeting_summary(channel: Channel, payload_dto, summarizer: Summarizer):
    room_id = payload_dto.get('roomId')
    conversation_text = payload_dto.get('content')
    
    await send_summarize_meeting_response(channel, room_id, "", "start")
    
    final_summary_text = ""
    accumulated_json = ""
    
    try:
        async for event in summarizer.summarize_meeting(conversation_text):
            msg_type = event["type"]
            content = event["content"]

            if msg_type == "text":
                final_summary_text += content
                print(f"--> [Py->Nest] Gửi về (text): {content[:50]}...")
                await send_summarize_meeting_response(channel, room_id, content, "chunk")
            
            elif msg_type == "json_chunk":
                print(f"--> [Py->Nest] Gửi về (json_chunk): {content[:50]}...")
                accumulated_json += content

        action_items = parse_llm_json(accumulated_json)
        print(f"--> [DONE] Action Items extracted: {len(action_items)}")

        final_payload = {
            "actionItems": action_items,
        }
        await send_summarize_meeting_response(channel, room_id, "", "end", metadata=final_payload)

        return {"status": "success", "actionItems": action_items, "summary": final_summary_text.strip()}

    except Exception as e:
        print(f"Lỗi: {e}")
        await send_summarize_meeting_response(channel, room_id, str(e), "error")
        return {"status": "error"}
    
def parse_llm_json(json_str):
    """
    Hàm helper để làm sạch và parse JSON từ LLM
    """
    try:
        clean_str = re.sub(r"```json|```", "", json_str).strip()
        if not clean_str: return []
        return json.loads(clean_str)
    except json.JSONDecodeError as e:
        print(f"Lỗi parse JSON từ LLM: {e}")
        print(f"Raw string: {json_str}")
        return []

async def send_status_file(channel: Channel, user_id, file_id, fileName,status, teamId: str = None):
    try:
        notification_body = { 
            "userId": user_id, 
            "teamId": teamId,
            "status": status,
            "fileId": file_id,
            "fileName": fileName
        }
        print(f"--> Đang gửi thông báo '{status}' cho file: {file_id}")
        print(f"--> Thống báo: {notification_body}")
        socket = await channel.get_exchange(EVENTS_EXCHANGE)
        await socket.publish(
            message=Message(json.dumps(notification_body).encode()),
            routing_key=SEND_FILE_STATUS_ROUTING_KEY
        )
        print(f"--> Đã gửi thông báo '{status}' cho file: {file_id}")
    except Exception as e:
        print(f"Lỗi khi gửi thông báo: {e}")

async def ingestion_callback(
    message: IncomingMessage, 
    vectorstore_service: VectorStoreService, 
    channel: Channel, 
    search_exchange: Exchange
    ):
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
            file_id = payload_dto.get('fileId')
            team_id = payload_dto.get('teamId')
            storage_key = payload_dto.get('storageKey')
            original_name = payload_dto.get('originalName')
            
            if not all([user_id, file_id, storage_key, original_name]):
                raise ValueError("Payload bị thiếu các trường bắt buộc (userId, fileId, storageKey, originalName).")
            
            print(f"--> Bắt đầu xử lý file '{file_name}' cho user '{user_id}'.")
            await send_notification(channel, user_id, file_id, "processing", f"File '{original_name}' is being processed.")
            await send_status_file(channel, user_id, file_id, original_name, "processing", team_id)
            await vectorstore_service.process_and_store(
                user_id=user_id,
                team_id=team_id,
                file_id=file_id,
                original_name=original_name,
                storage_key=storage_key,
                channel=channel,
                search_exchange=search_exchange
            )
            print(f"--> Xử lý file thành công!")
            await send_status_file(channel, user_id, file_id, original_name, "completed", team_id)
            await send_notification(channel, user_id, original_name, "success", f"File '{original_name}' had been processed successfully.")

        except Exception as e:
            error_message = str(e)
            print(f"Error processing '{file_name}': {error_message}")
            if payload_dto:
                user_id = payload_dto.get('userId')
                file_id = payload_dto.get('fileId')
                original_name = payload_dto.get('originalName', 'unknown file')
                await send_notification(channel, user_id, file_id, "failed", f"Failed to process '{original_name}': {error_message}")
                await send_status_file(channel, user_id, file_id ,original_name, "failed", team_id)
async def action_callback(message: IncomingMessage, rag_chain: RAGChain, summarizer: Summarizer, minio_service: MinioService, channel: Channel):
    """
    Callback xử lý các tác vụ tương tác (RAG, Summarize).
    """
    print(f"\n[ACTION] Nhận được yêu cầu tương tác mới...")
    
    socket_id, user_id, discussion_id, team_id = None, None, None, None
    membersToNotify = []
    pattern_from_key = "unknown"
    retrieved_metadata = None
    
    actual_routing_key = message.routing_key
    print(f"--> Nhận message với routing key: {actual_routing_key}")

    if actual_routing_key == ASK_QUESTION_ROUTING_KEY:
        pattern_from_key = "ask_question"
    elif actual_routing_key == SUMMARIZE_DOCUMENT_ROUTING_KEY:
        pattern_from_key = "summarize_document"
    elif actual_routing_key == SUMMARIZE_MEETING_ROUTING_KEY:
        pattern_from_key = "summarize_meeting"
    
    async with message.process():
        try:
            payload_dto = json.loads(message.body.decode())
            print(f"--> Payload DTO nhận được: {payload_dto}")

            socket_id = payload_dto.get('socketId')
            user_id = payload_dto.get('userId')
            discussion_id = payload_dto.get('discussionId')
            team_id = payload_dto.get('teamId')
            membersToNotify = payload_dto.get('membersToNotify', [])

            print(f"Socket ID: {socket_id}, User ID: {user_id}, Discussion ID: {discussion_id}, Team ID: {team_id}")

            if not all([socket_id, user_id, discussion_id]) and not pattern_from_key == 'summarize_meeting':
                raise ValueError("Tin nhắn thiếu socketId, userId, hoặc discussionId.")

            if pattern_from_key == 'ask_question':
                question = payload_dto.get('question')
                chat_history = payload_dto.get('chatHistory', [])
                if not question: raise ValueError("Tin nhắn thiếu 'question'.")

                print(f"--> [RAG] Câu hỏi từ user '{user_id}': {question}")
                await publish_response(channel, socket_id, discussion_id, "Thinking...", "start", team_id, membersToNotify=membersToNotify)
                
                async for chunk in rag_chain.ask_question_for_user(question, user_id, team_id, chat_history):
                    await publish_response(channel, socket_id, discussion_id, chunk, "chunk", team_id, membersToNotify=membersToNotify)
                
                retrieved_metadata = rag_chain.get_last_retrieved_context()
                print(f"--> [RAG] Đã lấy được metadata: {retrieved_metadata}")

            elif pattern_from_key == 'summarize_document':
                file_name = payload_dto.get('summarizeFileName') # Sửa: Key là summarizeFileName
                if not file_name: raise ValueError("Tin nhắn thiếu 'summarizeFileName'.")
                
                await publish_response(channel, socket_id, discussion_id, "Summarizing...", "start", team_id, membersToNotify=membersToNotify)
                print(f"--> [SUMMARIZE] Bắt đầu tóm tắt file '{file_name}' cho user '{user_id}'.")
                
                documents = await minio_service.load_documents(file_name)
                async for chunk in summarizer.summarize_documents(documents):
                    await publish_response(channel, socket_id, discussion_id, chunk, "chunk", team_id, membersToNotify=membersToNotify)
                    
            elif pattern_from_key == 'summarize_meeting':
                result_data = await handle_meeting_summary(channel, payload_dto, summarizer)
                if message.reply_to:
                    print(f"--> [RPC] Đang trả kết quả về cho NestJS (Correlation ID: {message.correlation_id})")
                    
                    response_body = json.dumps(result_data).encode()
                    
                    await channel.default_exchange.publish(
                        Message(
                            body=response_body,
                            correlation_id=message.correlation_id,
                            content_type="application/json"
                        ),
                        routing_key=message.reply_to 
                    )
                else:
                    print("--> [WARN] Không tìm thấy reply_to. NestJS có thể sẽ bị timeout.")
        except Exception as e:
            error_message = f"Lỗi khi xử lý '{pattern_from_key}': {e}"
            print(f"!!! LỖI: {error_message}")
            
            if socket_id and discussion_id:
                error_metadata = {"error": str(error_message)}
                try:
                    await publish_response(
                        channel, socket_id, discussion_id, 
                        str(error_message), "error", 
                        team_id, error_metadata, membersToNotify
                    )
                except Exception as e_pub:
                    print(f"!!! LỖI KHI GỬI LỖI: {e_pub}")

        finally:
            if socket_id and discussion_id:
                print(f"--> Đã gửi tín hiệu kết thúc stream cho tác vụ '{pattern_from_key}'.")
                try:
                    await publish_response(
                        channel, socket_id, discussion_id, 
                        "Stream has ended.", "end", 
                        team_id, retrieved_metadata, membersToNotify
                    )
                except Exception as e_pub:
                    print(f"!!! LỖI KHI GỬI 'END': {e_pub}")

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