import pika
import json
import os
from rag_core import process_and_store_documents, ask_question_for_user

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
INGESTION_QUEUE = 'ingestion_queue'
RAG_QUEUE = 'rag_queue'

def main():
    """Hàm chính để kết nối và khởi động các consumer."""
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.queue_declare(queue=INGESTION_QUEUE, durable=True)
    channel.queue_declare(queue=RAG_QUEUE, durable=True)

    print(f"[*] Đã kết nối tới RabbitMQ. Đang lắng nghe trên các hàng đợi: '{INGESTION_QUEUE}', '{RAG_QUEUE}'")

    def ingestion_callback(ch, method, properties, body):
        print(f"\n[INGESTION] Nhận được yêu cầu xử lý tài liệu mới...")
        try:
            message = json.loads(body.decode('utf-8'))
            
            pattern = message.get('pattern')
            if pattern != 'process_document':
                raise ValueError(f"Message pattern mismatch: expected 'process_document', got {pattern}")
            
            data = message.get('data', {})
            
            user_id = data.get('userId')
            file_path = data.get('filePath')

            if user_id and file_path:
                print(f"--> Bắt đầu xử lý file '{file_path}' cho user '{user_id}'.")
                process_and_store_documents(user_id=user_id, file_path=file_path)
                print(f"--> Xử lý file thành công!")
            else:
                print("Lỗi: Tin nhắn thiếu 'userId' hoặc 'filePath'.")

        except Exception as e:
            print(f"Lỗi khi xử lý tài liệu: {e}")
        finally:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    def rag_callback(ch, method, properties, body):
        print(f"\n[RAG] Nhận được một câu hỏi mới...")
        print(properties)
        reply_to_queue = properties.reply_to
        correlation_id = properties.correlation_id
        
        if not reply_to_queue: 
            print("Lỗi: Không có reply_to queue, không thể gửi phản hồi.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return 
        
        try:
            message = json.loads(body.decode('utf-8'))
            
            pattern = message.get('pattern')

            if pattern != 'ask_question':
                raise ValueError(f"Message pattern mismatch: expected 'ask_question', got {pattern}")
            
            data = message.get('data', {})
            user_id = data.get('userId')
            question = data.get('question')

            if user_id and question:
                print(f"--> Câu hỏi từ user '{user_id}': {question}")
                
                for answer_chunk in ask_question_for_user(question=question, user_id=user_id):
                    chunk_payload = json.dumps({"type": "chunk", "content": answer_chunk})
                    ch.basic_publish(
                        exchange='', 
                        routing_key=reply_to_queue, 
                        body=chunk_payload, 
                        properties=pika.BasicProperties(correlation_id=correlation_id)
                    )
                
            else:
                raise ValueError("Tin nhắn thiếu 'userId' hoặc 'question'.")

        except Exception as e:
            error_message = f"Lỗi khi trả lời câu hỏi: {e}"
            print(error_message)
            error_payload = json.dumps({"type": "error", "content": error_message})
            ch.basic_publish(
                exchange='',
                routing_key=reply_to_queue,
                properties=pika.BasicProperties(correlation_id=correlation_id),
                body=error_payload
            )
        finally:
            end_payload = json.dumps({"type": "end", "content": "Stream has ended."})
            ch.basic_publish(
                exchange='',
                routing_key=reply_to_queue,
                properties=pika.BasicProperties(correlation_id=correlation_id),
                body=end_payload
            )
            print("--> Đã gửi tín hiệu kết thúc stream.")
            ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=INGESTION_QUEUE, on_message_callback=ingestion_callback)
    channel.basic_consume(queue=RAG_QUEUE, on_message_callback=rag_callback)

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('Đã dừng worker.')
        connection.close()

if __name__ == '__main__':
    main()