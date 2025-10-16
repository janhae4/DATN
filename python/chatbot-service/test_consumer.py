import pika
import json
import uuid
import os
import time


RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
INGESTION_QUEUE = 'ingestion_queue'
RAG_QUEUE = 'rag_queue'

def main():
    """Hàm chính để gửi các tin nhắn test."""
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()

        channel.queue_declare(queue=INGESTION_QUEUE, durable=True)
        channel.queue_declare(queue=RAG_QUEUE, durable=True)

        print("Đã kết nối tới RabbitMQ. Chuẩn bị gửi tin nhắn test...")

        print("\n--- [TEST 1] Gửi yêu cầu nạp tài liệu ---")
        ingestion_payload = {
            "pattern": "process_document",
            "data": {
                "userId": "test_123",
                "filePath": "data/test.txt" 
            }
        }
        ingestion_message = json.dumps(ingestion_payload)
        
        channel.basic_publish(
            exchange='',
            routing_key=INGESTION_QUEUE,
            body=ingestion_message,
            properties=pika.BasicProperties(
                delivery_mode = 2,
            )
        )
        print(f"✅ Đã gửi tới queue '{INGESTION_QUEUE}': {ingestion_message}")
        
        time.sleep(2)

        print("\n--- [TEST 2] Gửi một câu hỏi RAG ---")
        result = channel.queue_declare(queue='', exclusive=True)
        reply_queue_name = result.method.queue
        print(f"   - Đã tạo queue tạm thời để nhận phản hồi: '{reply_queue_name}'")
        correlation_id = str(uuid.uuid4())
        rag_payload = {
            "pattern": "ask_question",
            "data": {
                "userId": "test_123",
                "question": "Quy trình xin nghỉ phép là gì?"
            }
        }
        rag_message = json.dumps(rag_payload)

        channel.basic_publish(
            exchange='',
            routing_key=RAG_QUEUE,
            body=rag_message,
            properties=pika.BasicProperties(
                delivery_mode = 2,
                correlation_id=correlation_id,
                reply_to=reply_queue_name
            )
        )
        print(f"✅ Đã gửi tới queue '{RAG_QUEUE}': {rag_message}")

        connection.close()
        print("\n--- TEST HOÀN TẤT. Đã đóng kết nối. ---")

    except pika.exceptions.AMQPConnectionError as e:
        print(f"❌ Lỗi kết nối tới RabbitMQ: {e}")
        print("Hãy chắc chắn rằng container RabbitMQ đang chạy.")
    except Exception as e:
        print(f"❌ Đã xảy ra lỗi không mong muốn: {e}")

if __name__ == '__main__':
    main()