import pika
import json
import os
from rag_core import process_and_store_documents, ask_question_for_user, summarize_document

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
INGESTION_QUEUE = os.getenv('INGESTION_QUEUE', 'ingestion_queue')
RAG_QUEUE = os.getenv('RAG_QUEUE', 'rag_queue')
SUMMARIZE_QUEUE = os.getenv('SUMMARIZE_QUEUE', 'summarize_queue')
RESPONSE_QUEUE = os.getenv('RESPONSE_QUEUE', 'chatbot_service_queue')

NOTIFICATION_QUEUE = os.getenv('NOTIFICATION_QUEUE', 'notifications_service_queue')

def send_notification(ch, user_id, file_name, status, message):
    """
    Hàm trợ giúp để gửi tin nhắn thông báo (thành công/thất bại) về NestJS.
    Sửa lại để publish ra exchange.
    """
    try:
        title = f"Process document {status}"
        notification_body = {
            "pattern": "notification.processDocument",
            "data": {
                "userId": user_id,
                "title": title,
                "message": message,
                # "type": "SUCCESS" if status == "success" else "ERROR",
                # "fileName": file_name
            }
        }
        
        ch.basic_publish(
            exchange="",
            routing_key=NOTIFICATION_QUEUE,
            body=json.dumps(notification_body),
            properties=pika.BasicProperties(content_type='application/json')
        )
        print(f"--> Đã gửi thông báo '{status}' cho file: {file_name}")
    except Exception as e:
        print(f"Lỗi khi gửi thông báo: {e}")

def ingestion_callback(ch, method, properties, body):
    print(f"\n[INGESTION] Nhận được yêu cầu xử lý tài liệu mới...")
    user_id = None
    file_name = None

    try:
        message = json.loads(body.decode('utf-8'))
        print(message)
        pattern = message.get('pattern')
        if pattern != 'process_document':
            raise ValueError(f"Message pattern mismatch: expected 'process_document', got {pattern}")
        
        data = message.get('data', {})
        user_id = data.get('userId')
        file_name = data.get('fileName')

        if user_id and file_name:
            print(f"--> Bắt đầu xử lý file '{file_name}' cho user '{user_id}'.")
            
            process_and_store_documents(user_id=user_id, file_name=file_name)
            
            print(f"--> Xử lý file thành công!")
            
            try:
                original_name = file_name.split('-', 1)[1]
            except IndexError:
                original_name = file_name
                
            send_notification(
                ch=ch,
                user_id=user_id,
                file_name=file_name,
                status="success",
                message=f"Tài liệu '{original_name}' của bạn đã được xử lý thành công."
            )
        else:
            raise ValueError("Tin nhắn thiếu 'userId' hoặc 'fileName'.")

    except Exception as e:
        error_message = str(e)
        print(f"Lỗi khi xử lý tài liệu {file_name}: {error_message}")
        
        if user_id and file_name:
            send_notification(
                ch=ch,
                user_id=user_id,
                file_name=file_name,
                status="failed",
                message=error_message
            )
            
    finally:
        ch.basic_ack(delivery_tag=method.delivery_tag)


def action_callback(ch, method, properties, body):
    """
    Callback này xử lý TẤT CẢ các tác vụ tương tác (RAG, Summarize, v.v.)
    và stream kết quả về RESPONSE_QUEUE.
    """
    print(f"\n[ACTION] Nhận được yêu cầu tương tác mới...")
    socket_id = None
    RESPONSE_PATTERN = 'rag_response'
    
    try:
        if body is None: raise ValueError("Nội dung tin nhắn bị rỗng (None).")
        message = json.loads(body.decode('utf-8'))
        
        pattern = message.get('pattern')
        data = message.get('data', {})
        socket_id = data.get('socketId')
        user_id = data.get('userId')
        
        if not socket_id: raise ValueError("Tin nhắn thiếu 'socketId'.")
        if not user_id: raise ValueError("Tin nhắn thiếu 'userId'.")
        
        generator = None
        
        if pattern == 'ask_question':
            question = data.get('question')
            if not question: raise ValueError("Tin nhắn thiếu 'question' cho ask_question.")
            
            print(f"--> [RAG] Câu hỏi từ user '{user_id}': {question}")
            generator = ask_question_for_user(question=question, user_id=user_id)
        
        elif pattern == 'summarize_document':
            file_name = data.get('fileName')
            if not file_name: raise ValueError("Tin nhắn thiếu 'fileName' cho summarize_document.")
            
            print(f"--> [SUMMARIZE] Bắt đầu tóm tắt file '{file_name}' cho user '{user_id}'.")
            generator = summarize_document(user_id=user_id, file_name=file_name)
        
        else:
            raise ValueError(f"Message pattern không xác định: '{pattern}'")
        
        for chunk in generator:
            body_dict = {
                "pattern": RESPONSE_PATTERN,
                "data": { "socketId": socket_id, "content": chunk, "type": "chunk" }
            }
            ch.basic_publish(
                exchange='', 
                routing_key=RESPONSE_QUEUE, 
                body=json.dumps(body_dict),
                properties=pika.BasicProperties(correlation_id=socket_id)
            )

    except Exception as e:
        error_message = f"Lỗi khi xử lý tác vụ '{pattern}': {e}"
        print(error_message)
        if socket_id: 
            body_dict = {
                "pattern": RESPONSE_PATTERN,
                "data": { "socketId": socket_id, "content": str(error_message), "type": "error" }
            }
            ch.basic_publish(
                exchange='',
                routing_key=RESPONSE_QUEUE,
                properties=pika.BasicProperties(correlation_id=socket_id),
                body=json.dumps(body_dict)  
            )
            
    finally:
        if socket_id:
            body_dict = {
                "pattern": RESPONSE_PATTERN,
                "data": { "socketId": socket_id, "content": "Stream has ended.", "type": "end" }
            }
            ch.basic_publish(
                exchange='', 
                routing_key=RESPONSE_QUEUE, 
                body=json.dumps(body_dict),
                properties=pika.BasicProperties(correlation_id=socket_id)
            )
            print(f"--> Đã gửi tín hiệu kết thúc stream cho tác vụ '{pattern}'.")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    """Hàm chính để kết nối và khởi động các consumer."""
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.queue_declare(queue=INGESTION_QUEUE, durable=True)
    channel.queue_declare(queue=RAG_QUEUE, durable=True)
    channel.queue_declare(queue=RESPONSE_QUEUE, durable=True)
    
    print(f"[*] Đã kết nối tới RabbitMQ. Đang lắng nghe trên các hàng đợi:")
    print(f"  - {INGESTION_QUEUE} (Xử lý tài liệu)")
    print(f"  - {RAG_QUEUE} (Hỏi đáp RAG)")

    channel.basic_qos(prefetch_count=1)
    
    channel.basic_consume(queue=INGESTION_QUEUE, on_message_callback=ingestion_callback)
    channel.basic_consume(queue=RAG_QUEUE, on_message_callback=action_callback)
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('Đã dừng worker.')
        connection.close()
    except Exception as e:
        print(f"Worker đã sập: {e}")
        connection.close()

if __name__ == '__main__':
    main()