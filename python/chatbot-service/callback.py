import json
import redis.asyncio as redis
from aio_pika import Exchange, IncomingMessage, Channel, Message
from services.vectorstore_service import VectorStoreService
from services.minio_service import MinioService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from chains.task_architect import TaskArchitect
from config import (
    EVENTS_EXCHANGE,
    ASK_QUESTION_ROUTING_KEY,
    SEND_FILE_STATUS_ROUTING_KEY,
    SEND_NOTIFICATION_ROUTING_KEY,
    SUGGEST_TASK_ROUTING_KEY,
    SUMMARIZE_DOCUMENT_ROUTING_KEY,
    STREAM_RESPONSE_ROUTING_KEY,
    SOCKET_EXCHANGE,
    TASK_EXCHANGE
)

redis_client = redis.Redis(host='localhost', port=6379, db=0)

async def publish_to_redis(discussion_id: str, content: str, is_completed: bool = False, metadata: dict = None):
    """
    Gửi dữ liệu trực tiếp vào Redis Channel để SSE Gateway ở NestJS nhận được.
    """
    channel = f"ai_stream:{discussion_id}"
    payload = {
        "text": content,
        "isCompleted": is_completed,
        "metadata": metadata if metadata else {}
    }
    await redis_client.publish(channel, json.dumps(payload))

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

async def publish_suggest_task_response(user_id: str, content: dict):
    """
    Helper chuyên dụng để gửi dữ liệu Task về SSE Stream của NestJS qua RabbitMQ.
    """
    payload = {
        "userId": user_id,
        **content
    }    
    print(f"--> [Py->SSE] Chuẩn bị gửi task cho {user_id}: {content}")
    message_json = json.dumps(payload)
    await redis_client.publish(f"task_suggest:{user_id}", message_json)
    print(f"--> [Py->SSE] Gửi task cho {user_id}: {content.get('title', 'SIGNAL')}")

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

async def action_callback(message: IncomingMessage, rag_chain: RAGChain, summarizer: Summarizer, minio_service: MinioService, task_architect: TaskArchitect, channel: Channel):
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
    elif actual_routing_key == SUGGEST_TASK_ROUTING_KEY:
        pattern_from_key = "suggest_task"
    
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

            if pattern_from_key == 'suggest_task':
                if not user_id: raise ValueError("Thiếu userId cho luồng gợi ý task.")
            else:
                if not all([user_id, discussion_id]):
                    raise ValueError("Thiếu socketId hoặc discussionId cho luồng chat.")

            if pattern_from_key == 'ask_question':
                question = payload_dto.get('question')
                chat_history = payload_dto.get('chatHistory', [])
                if not question: raise ValueError("Tin nhắn thiếu 'question'.")

                print(f"--> [RAG] Câu hỏi từ user '{user_id}': {question}")
                # await publish_to_redis(discussion_id, question, is_completed=False)
                
                async for chunk in rag_chain.ask_question_for_user(question, user_id, team_id, chat_history):
                    await publish_to_redis(discussion_id, chunk, is_completed=False)
                    # await publish_response(channel, socket_id, discussion_id, chunk, "chunk", team_id, membersToNotify=membersToNotify)
                
                retrieved_metadata = rag_chain.get_last_retrieved_context()
                await publish_to_redis(discussion_id, "", is_completed=True, metadata=retrieved_metadata)
                print(f"--> [RAG] Đã lấy được metadata: {retrieved_metadata}")

            elif pattern_from_key == 'summarize_document':
                file_name = payload_dto.get('summarizeFileName')
                if not file_name: raise ValueError("Tin nhắn thiếu 'summarizeFileName'.")
                
                await publish_response(channel, socket_id, discussion_id, "Summarizing...", "start", team_id, membersToNotify=membersToNotify)
                print(f"--> [SUMMARIZE] Bắt đầu tóm tắt file '{file_name}' cho user '{user_id}'.")
                
                documents = await minio_service.load_documents(file_name)
                async for chunk in summarizer.summarize(documents):
                    await publish_to_redis(discussion_id, chunk, is_completed=False)
                    
                await publish_to_redis(discussion_id, "", is_completed=True)
            
            elif pattern_from_key == 'suggest_task':
                raw_objective = payload_dto.get('objective')
                members = payload_dto.get('members', [])
                
                if len(raw_objective) > 20:
                    print(f"--> [SUGGEST TASK] Objective quá dài, đang tóm tắt...")
                    objective = await summarizer.summarize_objective(raw_objective)
                    await publish_suggest_task_response(user_id, {"objective": objective, "type": "summarized"})
                else: 
                    objective = raw_objective
                print(f"--> [SUGGEST TASK] Bắt đầu gợi ý task cho user '{user_id}' với mục tiêu: {objective}")
                if not objective: raise ValueError("Tin nhắn thiếu 'objective'.")

                print (f"--> [SUGGEST TASK] Objective: {objective}")
                print (f"--> [SUGGEST TASK] Members: {members}")
                buffer = ""
                async for chunk in task_architect.suggest_and_assign(
                    objective=payload_dto.get('objective', ''),
                    members=payload_dto.get('members', [])
                ):
                    buffer += chunk
                    if "\n" in buffer:
                        print(f"--> [SUGGEST TASK] Buffer hiện tại:\n{buffer}")
                        lines = buffer.split("\n")
                        for line in lines[:-1]:
                            line = line.strip()
                            if "|" in line:
                                parts = line.split("|")
                                if len(parts) >= 2:
                                    task_data = {
                                        "userId": payload_dto.get('userId'),
                                        "title": parts[0].strip(),
                                        "memberId": parts[1].strip(),
                                        "skillName": parts[2].strip(),
                                        "experience": int(parts[3].strip()),
                                        "reason": parts[4].strip() if len(parts) > 4 else "",
                                        "startDate": parts[5].strip() if len(parts) > 5 else "",
                                        "dueDate": parts[6].strip() if len(parts) > 6 else "",
                                        "type": "task"
                                    }
                                    print(f"--> [SUGGEST TASK] Gửi task: {task_data}")
                                    await publish_suggest_task_response(payload_dto.get('userId'), task_data)
                                print(f"--> [SUGGEST TASK] line: {line}")
                        
                        buffer = lines[-1]

                if buffer.strip() and "|" in buffer:
                    print(f"--> [SUGGEST TASK] Gửi phần còn lại trong buffer:\n{buffer}")
                    task_data = {
                                        "userId": payload_dto.get('userId'),
                                        "title": parts[0].strip(),
                                        "memberId": parts[1].strip(),
                                        "skillName": parts[2].strip(),
                                        "experience": int(parts[3].strip()),
                                        "reason": parts[4].strip() if len(parts) > 4 else "",
                                        "startDate": parts[5].strip() if len(parts) > 5 else "",
                                        "dueDate": parts[6].strip() if len(parts) > 6 else "",
                                        "type": "task"
                                    }
                    await publish_suggest_task_response(payload_dto.get('userId'), task_data)
                await publish_suggest_task_response(payload_dto.get('userId'), {"type": "done"})
        except Exception as e:
            if pattern_from_key == 'suggest_task' and user_id:
                await publish_suggest_task_response(user_id, {"type": "error", "message": str(e)})
            elif socket_id and discussion_id:
                await publish_response(channel, socket_id, discussion_id, str(e), "error", team_id)         
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