import json
import base64
import redis.asyncio as redis
from aio_pika import Exchange, IncomingMessage, Channel, Message
from services.vectorstore_service import VectorStoreService
from services.minio_service import MinioService
from services.gemini_service import GeminiService
from chains.rag_chain import RAGChain
from chains.summarizer import Summarizer
from chains.task_architect import TaskArchitect
from config import (
    EVENTS_EXCHANGE,
    ASK_QUESTION_ROUTING_KEY,
    SEARCH_EXCHANGE,
    SEND_FILE_STATUS_ROUTING_KEY,
    SUGGEST_TASK_ROUTING_KEY,
    STREAM_RESPONSE_ROUTING_KEY,
    REDIS_HOST,
    SUMMARIZE_DOCUMENT_ROUTING_KEY,
    HANDLE_MESSAGE_ROUTING_KEY
)

redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0)

class NotificationType:
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    INFO = "INFO"
    WARNING = "WARNING"

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
            
            if not all([user_id, file_id, storage_key]):
                raise ValueError("Payload bị thiếu các trường bắt buộc (userId, fileId, storageKey).")
            
            print(f"--> Bắt đầu xử lý file '{file_id}' cho user '{user_id}'.")
            await send_status_file(channel, user_id, file_id, original_name or storage_key, "processing", team_id)
            await vectorstore_service.process_and_store(
                user_id=user_id,
                file_id=storage_key,
                search_exchange=search_exchange,
                team_id=team_id,
                original_name=original_name
            )
            print(f"--> Xử lý file thành công!")
            await send_status_file(channel, user_id, file_id, original_name or storage_key, "completed", team_id)

        except Exception as e:
            error_message = str(e)
            print(f"Error processing '{file_id}': {error_message}")
            if payload_dto:
                user_id = payload_dto.get('userId')
                file_id = payload_dto.get('fileId')
                original_name = payload_dto.get('originalName', 'unknown file')
                team_id = payload_dto.get('teamId')
                await send_status_file(channel, user_id, file_id ,original_name, "failed", team_id)

async def action_callback(message: IncomingMessage, rag_chain: RAGChain, summarizer: Summarizer, suggest_summarizer: Summarizer, minio_service: MinioService, task_architect: TaskArchitect, vectorstore_service: VectorStoreService, channel: Channel):
    """
    Callback xử lý các tác vụ tương tác (RAG, Summarize).
    """
    print(f"\n[ACTION] Nhận được yêu cầu tương tác mới...")
    
    socket_id, user_id, discussion_id, team_id = None, None, None, None
    pattern_from_key = "unknown"
    retrieved_metadata = None
    
    actual_routing_key = message.routing_key
    print(f"--> Nhận message với routing key: {actual_routing_key}")

    if actual_routing_key == ASK_QUESTION_ROUTING_KEY:
        pattern_from_key = "ask_question"
    elif actual_routing_key == SUMMARIZE_DOCUMENT_ROUTING_KEY:
        pattern_from_key = "summarize_document"
    elif actual_routing_key == SUGGEST_TASK_ROUTING_KEY or actual_routing_key == 'suggest_task':
        pattern_from_key = "suggest_task"
    elif actual_routing_key == HANDLE_MESSAGE_ROUTING_KEY:
        pattern_from_key = "handle_message"
    
    async with message.process():
        try:
            payload_dto = json.loads(message.body.decode())
            print(f"--> Payload DTO nhận được: {payload_dto}")

            socket_id = payload_dto.get('socketId')
            user_id = payload_dto.get('userId')
            discussion_id = payload_dto.get('discussionId')
            team_id = payload_dto.get('teamId')

            print(f"Socket ID: {socket_id}, User ID: {user_id}, Discussion ID: {discussion_id}, Team ID: {team_id}")
            print(f"--> [RAG] Bắt đầu tương tác...")

            # Nếu là handle_message, ta kiểm tra payload để phân loại cụ thể
            if pattern_from_key == "handle_message":
                if payload_dto.get("summarizeFileName"):
                    pattern_from_key = "summarize_document"
                elif payload_dto.get("query") and "projectId" in payload_dto:
                    pattern_from_key = "task.suggestTask"
                else:
                    pattern_from_key = "ask_question"
            
            print(f"--> [RAG] Pattern thực tế: {pattern_from_key}")

            if pattern_from_key == 'task.suggestTask' or pattern_from_key == 'suggest_task':
                pattern_from_key = 'suggest_task' # Normalize internal key
                if not user_id: raise ValueError("Thiếu userId cho luồng gợi ý task.")
            elif pattern_from_key == 'summarize_document':
                if not user_id: raise ValueError("Thiếu userId cho luồng tóm tắt.")
            else:
                if not user_id:
                    raise ValueError("Thiếu userId cho luồng chat.")


            if pattern_from_key == 'ask_question':
                question = payload_dto.get('question') or payload_dto.get('message')
                chat_history = payload_dto.get('chatHistory', [])
                file_ids = payload_dto.get('fileIds') or None  # list of storageKeys to filter RAG
                if not question: raise ValueError("Tin nhắn thiếu 'question' hoặc 'message'.")

                print(f"--> [RAG] Câu hỏi từ user '{user_id}': {question}")
                
                # Biến lưu trữ kết quả để trả về RPC
                final_response_dto = None
                
                stream_id = discussion_id if discussion_id else f"temp_chat:{user_id}"
                
                async for chunk in rag_chain.ask_question_for_user(question, user_id, team_id, chat_history, file_ids=file_ids):
                    await publish_to_redis(stream_id, chunk, is_completed=False)
                
                retrieved_metadata = rag_chain.get_last_retrieved_context()
                await publish_to_redis(stream_id, "", is_completed=True, metadata=retrieved_metadata)
                print(f"--> [RAG] Đã lấy được metadata: {retrieved_metadata}")
                
                final_response_dto = {
                    "id": discussion_id,
                    "title": "AI Reply",
                    "messages": []
                }

            elif pattern_from_key == 'summarize_document':
                file_name = payload_dto.get('summarizeFileName')
                original_name = payload_dto.get('originalName')
                if not file_name: raise ValueError("Tin nhắn thiếu 'summarizeFileName'.")
                
                print(f"--> [SUMMARIZE] Yêu cầu từ user '{user_id}' cho file: {original_name or file_name}")
                
                try:
                    documents = await vectorstore_service.process_and_store(
                        user_id, 
                        file_name, 
                        search_exchange=SEARCH_EXCHANGE, 
                        team_id=team_id,
                        original_name=original_name
                    )
                    print(f"--> [VECTOR] Đã lưu xong!")
                    stream_id = discussion_id if discussion_id else f"summary:{user_id}"
                    async for chunk in summarizer.summarize(documents):
                        await publish_to_redis(stream_id, chunk, is_completed=False)
                    await publish_to_redis(stream_id, "", is_completed=True)
                    print(f"--> [SUMMARIZE] Đã gửi bản tóm tắt hoàn tất cho user '{user_id}'.")
                    final_response_dto = {"status": "success"}
                except Exception as e:
                    print(f"--> [VECTOR ERROR] Lỗi lưu vector: {e}")
                    
            
            elif pattern_from_key == 'suggest_task':
                print(f"--> [SUGGEST TASK] Bắt đầu tương tác...")
                raw_objective = payload_dto.get('objective') or payload_dto.get('query', '')
                members = payload_dto.get('members', [])
                print(f"--> [SUGGEST TASK] Nhận được objective: length: {len(raw_objective)}")
                if len(raw_objective) > 20:
                    print(f"--> [SUGGEST TASK] Objective quá dài, đang tóm tắt...")
                    objective = await suggest_summarizer.summarize_objective(raw_objective)
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
                                if len(parts) >= 4:
                                    skills = [s.strip() for s in parts[2].split(",") if s.strip()]
                                    for skill in skills:
                                        task_data = {
                                            "userId": payload_dto.get('userId'),
                                            "title": parts[0].strip().lstrip('*-0123456789. '),
                                            "memberId": parts[1].strip(),
                                            "skillNames": [skill],
                                            "experience": int(''.join(filter(str.isdigit, parts[3])) or '10'),
                                            "reason": parts[4].strip() if len(parts) > 4 else "",
                                            "startDate": parts[5].strip() if len(parts) > 5 else "",
                                            "dueDate": parts[6].strip() if len(parts) > 6 else "",
                                            "type": "task"
                                        }
                                        print(f"--> [SUGGEST TASK] Gửi task (skill: {skill}): {task_data}")
                                        await publish_suggest_task_response(payload_dto.get('userId'), task_data)
                                print(f"--> [SUGGEST TASK] line: {line}")
                        
                        buffer = lines[-1]

                if buffer.strip() and "|" in buffer:
                    print(f"--> [SUGGEST TASK] Gửi phần còn lại trong buffer:\n{buffer}")
                    parts = buffer.split("|")
                    if len(parts) >= 4:
                        skills = [s.strip() for s in parts[2].split(",") if s.strip()]
                        for skill in skills:
                            task_data = {
                                "userId": payload_dto.get('userId'),
                                "title": parts[0].strip().lstrip('*-0123456789. '),
                                "memberId": parts[1].strip(),
                                "skillNames": [skill],
                                "experience": int(''.join(filter(str.isdigit, parts[3])) or '10'),
                                "reason": parts[4].strip() if len(parts) > 4 else "",
                                "startDate": parts[5].strip() if len(parts) > 5 else "",
                                "dueDate": parts[6].strip() if len(parts) > 6 else "",
                                "type": "task"
                            }
                            await publish_suggest_task_response(payload_dto.get('userId'), task_data)
                await publish_suggest_task_response(payload_dto.get('userId'), {"type": "done"})
                print(f"--> [SUGGEST TASK] Đã gửi toàn bộ gợi ý task cho user '{user_id}'.")
                final_response_dto = {"status": "success"}

            # --- QUAN TRỌNG: GỬI PHẢN HỒI RPC CHO NESTJS ---
            if message.reply_to:
                print(f"--> [RPC] Gửi kết quả về hàng đợi: {message.reply_to}")
                await channel.default_exchange.publish(
                    Message(
                        body=json.dumps({"data": final_response_dto}).encode(),
                        correlation_id=message.correlation_id
                    ),
                    routing_key=message.reply_to
                )

        except Exception as e:
            print(f"--> [ACTION ERROR] Fatal error in action_callback: {e}")
            import traceback
            traceback.print_exc()
            
            if pattern_from_key == 'suggest_task' and user_id:
                error_msg = str(e)
                retry_after = 0
                import re
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    match = re.search(r"retry in ([\d\.]+)s", error_msg)
                    if match:
                        retry_after = float(match.group(1))
                    
                    await publish_suggest_task_response(user_id, {
                        "type": "error", 
                        "message": "AI services are temporarily reaching rate limits.",
                        "retryAfter": retry_after or 60
                    })
                else:
                    await publish_suggest_task_response(user_id, {"type": "error", "message": error_msg})
            elif socket_id and discussion_id:
                await publish_response(channel, socket_id, discussion_id, "", "done", team_id)
                
                # Tạo DTO để trả về cho RPC (NestJS unwrapRpcResult)
                final_response_dto = {
                    "id": discussion_id,
                    "title": "AI Reply",
                    "messages": [] # Có thể bổ sung message nếu cần
                }
                if message.reply_to:
                    print(f"--> [RPC ERROR] Gửi lỗi về hàng đợi: {message.reply_to}")
                    await channel.default_exchange.publish(
                        Message(
                            body=json.dumps({"error": str(e)}).encode(),
                            correlation_id=message.correlation_id
                        ),
                        routing_key=message.reply_to
                    )
                return
            elif pattern_from_key == 'summarize_document':
                if message.reply_to:
                    print(f"--> [RPC ERROR] Gửi lỗi về hàng đợi: {message.reply_to}")
                    await channel.default_exchange.publish(
                        Message(
                            body=json.dumps({"error": str(e)}).encode(),
                            correlation_id=message.correlation_id
                        ),
                        routing_key=message.reply_to
                    )
                return
            else:
                if socket_id and discussion_id:
                    await publish_response(channel, socket_id, discussion_id, str(e), "error", team_id) 
                return        

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
            print(f"[DELETE] Lỗi nghiêm trọng khi xóa collection: {e}")

async def on_document_deleted(message: IncomingMessage, vector_store: VectorStoreService):
    """
    Callback lắng nghe sự kiện xóa document từ NestJS để xóa các chunk liên quan trong ChromaDB.
    """
    print(f"\n[DELETE] Nhận được yêu cầu xóa tài liệu lẻ...")
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            print(payload)
            storage_keys = payload.get('fileIds', [])
            user_id = payload.get('userId')
            team_id = payload.get('teamId')
            
            if storage_keys is None or not user_id:
                print(f"[DELETE] Lỗi: Payload thiếu fileIds hoặc userId.")
                return

            collection_name = f"user_{user_id}" if team_id is None else f"team_{team_id}"
            
            print(f"[DELETE] Đang xóa {len(storage_keys)} file khỏi collection: {collection_name}")
            for key in storage_keys:
                await vector_store.delete_documents_by_source(collection_name, key)
            
            print(f"[DELETE] Xóa hoàn tất.")
            
        except Exception as e:
            print(f"[DELETE] Lỗi nghiêm trọng khi xóa tài liệu lẻ: {e}")

async def audio_transcription_callback(message: IncomingMessage, gemini_service, channel: Channel):
    async with message.process():
        try:
            body = json.loads(message.body.decode())
            room_id = body.get("roomId")
            user_id = body.get("userId")
            user_name = body.get("userName")
            chunk_b64 = body.get("chunk")
            
            if not chunk_b64:
                print(f"⚠️ [Worker] Nhận body nhưng không có chunk dữ liệu.")
                return

            print(f"🎙️ [Worker] Đang xử lý Audio Chunk từ {user_name} ({len(chunk_b64)} chars) cho Room {room_id}...")

            # Decode audio
            try:
                audio_data = base64.b64decode(chunk_b64)
                print(f"✅ [Worker] Decode Base64 thành công: {len(audio_data)} bytes.")
            except Exception as de:
                print(f"❌ [Worker] Lỗi Decode Base64: {de}")
                return
            
            # Transcribe
            transcript = gemini_service.transcribe_audio(audio_data)
            
            if transcript:
                print(f"🎯 [AI] Kết quả: {transcript}")
                # Send back to Go (video_chat_exchange)
                response_payload = {
                    "roomId": room_id,
                    "userId": user_id,
                    "userName": user_name,
                    "content": transcript
                }
                
                video_chat_exchange = await channel.get_exchange("video_chat_exchange")
                
                await video_chat_exchange.publish(
                    Message(json.dumps(response_payload).encode()),
                    routing_key="video_chat.transcript.receive"
                )
            else:
                print(f"🤫 [AI] Không phát hiện tiếng nói hoặc lỗi API.")
                
        except Exception as e:
            print(f"❌ [Worker] Lỗi trong audio_transcription_callback: {e}")

async def get_unique_skills_callback(message: IncomingMessage, channel: Channel):
    """
    RPC handler để lấy danh sách kỹ năng duy nhất của một hoặc nhiều user.
    """
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            user_ids = payload.get('userIds', [])
            if not isinstance(user_ids, list):
                user_ids = [user_ids] if user_ids else []
                
            print(f"--> [GET SKILLS] Nhận yêu cầu lấy kỹ năng cho: {user_ids}")
            
            if not user_ids:
                if message.reply_to:
                    await channel.default_exchange.publish(
                        Message(body=json.dumps({"data": []}).encode(), correlation_id=message.correlation_id),
                        routing_key=message.reply_to
                    )
                return

            from config import USER_EXCHANGE, GET_BULK_SKILLS_ROUTING_KEY
            
            # Tạo temporary queue để nhận phản hồi RPC từ User Service
            callback_queue = await channel.declare_queue("", exclusive=True, auto_delete=True)
            future = asyncio.get_event_loop().create_future()

            async def on_response(msg: IncomingMessage):
                if msg.correlation_id == message.correlation_id:
                    try:
                        future.set_result(json.loads(msg.body.decode()))
                    except Exception as ex:
                        future.set_exception(ex)

            consumer_tag = await callback_queue.consume(on_response, no_ack=True)

            try:
                # Gửi RPC sang User Service
                user_exchange = await channel.get_exchange(USER_EXCHANGE)
                await user_exchange.publish(
                    Message(
                        body=json.dumps(user_ids).encode(),
                        reply_to=callback_queue.name,
                        correlation_id=message.correlation_id
                    ),
                    routing_key=GET_BULK_SKILLS_ROUTING_KEY
                )

                # Chờ kết quả
                response_data = await asyncio.wait_for(future, timeout=5.0)
                
                # Unwrap data từ NestJS (thường bọc trong { "data": ... })
                users = response_data.get('data') if isinstance(response_data, dict) and 'data' in response_data else response_data
                
                unique_skills = set()
                if isinstance(users, list):
                    for user in users:
                        skills = user.get('skills', [])
                        for s in skills:
                            name = s.get('skillName')
                            if name:
                                unique_skills.add(name.strip())
                
                result = sorted(list(unique_skills))
                print(f"--> [GET SKILLS] Tìm thấy {len(result)} kỹ năng duy nhất.")

                if message.reply_to:
                    await channel.default_exchange.publish(
                        Message(
                            body=json.dumps({"data": result}).encode(),
                            correlation_id=message.correlation_id
                        ),
                        routing_key=message.reply_to
                    )
            finally:
                await callback_queue.cancel(consumer_tag)
                await callback_queue.delete()

        except Exception as e:
            print(f"--> [GET SKILLS ERROR]: {e}")
            if message.reply_to:
                await channel.default_exchange.publish(
                    Message(body=json.dumps({"error": str(e)}).encode(), correlation_id=message.correlation_id),
                    routing_key=message.reply_to
                )

async def summarize_meeting_callback(message: IncomingMessage, gemini_service: GeminiService, channel: Channel):
    """
    Callback xử lý tổng kết cuộc họp (Meeting Summary & Action Items).
    Dành cho RPC request từ Video Chat Service.
    """
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            content = payload.get('content', '')
            room_id = payload.get('roomId', 'unknown')
            
            print(f"--> [SUMMARIZE MEETING] Đang xử lý cho phòng: {room_id}")
            if not content:
                if message.reply_to:
                    await channel.default_exchange.publish(
                        Message(body=json.dumps({"data": {"summary": "Không có nội dung thảo luận.", "actionItems": []}}).encode(), correlation_id=message.correlation_id),
                        routing_key=message.reply_to
                    )
                return

            prompt = f"""
                Bạn là một trợ lý AI phân tích cuộc họp chuyên nghiệp. 
                Dưới đây là bản gỡ băng (transcript) của một cuộc họp:
                
                "{content}"
                
                Hãy thực hiện các yêu cầu sau:
                1. **Tóm tắt nội dung chính**: Viết các đoạn văn tóm tắt ngắn gọn các vấn đề đã thảo luận.
                2. **Kỹ năng liên quan (Required Skills)**: Dựa trên các công việc hoặc chủ đề được nhắc tới, hãy liệt kê các kỹ năng kỹ thuật hoặc chuyên môn cần thiết. Bạn có thể tự đề xuất các kỹ năng mới nếu thấy phù hợp và hữu ích.
                3. **Danh sách Action Items**: Trích xuất các nhiệm vụ/công việc cụ thể được giao hoặc đồng thuận trong cuộc họp.
                
                ĐỊNH DẠNG TRẢ VỀ (BẮT BUỘC LÀ JSON):
                {{
                  "summary": "Nội dung tóm tắt kèm phần kỹ năng ở định dạng Markdown",
                  "actionItems": [
                    {{ "content": "Nhiệm vụ 1" }},
                    {{ "content": "Nhiệm vụ 2" }}
                  ]
                }}
                
                Lưu ý:
                - Trong phần "summary", hãy thêm tiêu đề "### Kỹ năng yêu cầu" để liệt kê các kỹ năng tìm thấy.
                - Chỉ trả về chuỗi JSON hợp lệ, không có lời dẫn.
            """
            
            messages = [{"role": "user", "content": prompt}]
            
            # Sử dụng chatWithOutStream để nhận kết quả cuối cùng
            response = await asyncio.to_thread(gemini_service.chatWithOutStream, messages)
            ai_text = response.get('message', {}).get('content', '')
            
            # Parse JSON an toàn
            import re
            json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
            if json_match:
                try:
                    raw_json = json_match.group()
                    result = json.loads(raw_json)
                except Exception as je:
                    print(f"--> [JSON PARSE ERROR]: {je}")
                    result = { "summary": ai_text, "actionItems": [] }
            else:
                result = { "summary": ai_text, "actionItems": [] }
            
            if message.reply_to:
                # Lưu ý: NestJS RmqClient mong đợi data nằm trong field "data" hoặc trực tiếp kết quả
                # Thông thường unwrapRpcResult sẽ xử lý cả hai, nhưng ta bọc trong "data" cho chắc
                await channel.default_exchange.publish(
                    Message(
                        body=json.dumps({"data": result}).encode(),
                        correlation_id=message.correlation_id,
                        content_type="application/json"
                    ),
                    routing_key=message.reply_to
                )
                print(f"--> [SUMMARIZE MEETING] Đã gửi phản hồi thành công.")
                
        except Exception as e:
            print(f"❌ [SUMMARIZE MEETING ERROR]: {e}")
            if message.reply_to:
                await channel.default_exchange.publish(
                    Message(body=json.dumps({"error": str(e)}).encode(), correlation_id=message.correlation_id),
                    routing_key=message.reply_to
                )