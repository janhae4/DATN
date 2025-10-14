import re
from datetime import datetime, timedelta
from typing import TypedDict, Optional, Literal, Dict, List, Any
import pika
import spacy
import json
import calendar
import os


PRIORITY_KEYWORDS: Dict[int, List[str]] = {
    5: ["gấp", "khẩn", "ngay lập tức", "phải làm liền"],
    4: ["ưu tiên", "deadline", "ngay", "hôm nay", "nay"],
    3: ["nhớ", "cần làm", "quan trọng", "dự định", "rất cần"],
    2: ["nên làm", "mai", "tuần này"],
    1: ["để sau", "lúc rảnh", "không gấp", "lát nữa", "mốt"],
}


class DateTimeRangeResult(TypedDict):
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    before_time: Optional[datetime]
    after_time: Optional[datetime]


def start_of_day(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)

def end_of_month(dt: datetime) -> datetime:
    _, last_day = calendar.monthrange(dt.year, dt.month)
    return dt.replace(day=last_day, hour=0, minute=0, second=0, microsecond=0)

def detect_priority(text: str, current_date: datetime = None) -> Literal[1, 2, 3, 4, 5]:
    if current_date is None:
        current_date = datetime.now()

    lower_text = text.lower()
    max_priority: Literal[1, 2, 3, 4, 5] = 3

    for score, keywords in PRIORITY_KEYWORDS.items():
        if any(kw in lower_text for kw in keywords):
            if score > max_priority:
                max_priority = score

    time_regex = r"\b(\d{1,2}h|\d{1,2}:\d{2})\b"
    has_time = re.search(time_regex, lower_text)

    if (
        has_time or "hôm nay" in lower_text or "nay" in lower_text
    ) and max_priority < 4:
        max_priority = 4

    if "mai" in lower_text and max_priority < 2:
        max_priority = 2

    if "mốt" in lower_text and max_priority < 1:
        max_priority = 1

    return max_priority

def _has_specific_hour(text: str) -> bool:
    return re.search(r"\b(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?\b", text) is not None

def _get_relative_date(lower_text: str, current_date: datetime) -> Optional[datetime]:
    current_day_of_week = current_date.weekday()
    
    if "hôm nay" in lower_text or "nay" in lower_text:
        return start_of_day(current_date)
    if "ngày mai" in lower_text or "mai" in lower_text:
        return start_of_day(current_date + timedelta(days=1))
    if "mốt" in lower_text:
        return start_of_day(current_date + timedelta(days=2))
    if "kia" in lower_text:
        return start_of_day(current_date + timedelta(days=3))

    if "cuối tuần sau" in lower_text:
        days_until_sunday = (6 - current_day_of_week) + 7
        return start_of_day(current_date + timedelta(days=days_until_sunday))
    if "cuối tuần này" in lower_text or "cuối tuần" in lower_text:
        days_until_sunday = 6 - current_day_of_week
        return start_of_day(current_date + timedelta(days=days_until_sunday))
    if "đầu tuần sau" in lower_text or "tuần sau" in lower_text:
        days_until_monday = 7 - current_day_of_week
        return start_of_day(current_date + timedelta(days=days_until_monday))
    if "đầu tuần này" in lower_text or "đầu tuần" in lower_text:
        days_until_monday = -current_day_of_week
        return start_of_day(current_date + timedelta(days=days_until_monday))
    
    if "tháng sau" in lower_text:
        y = current_date.year + (1 if current_date.month == 12 else 0)
        m = 1 if current_date.month == 12 else current_date.month + 1
        return datetime(y, m, 1)

    if "cuối tháng" in lower_text or "hết tháng" in lower_text:
        return end_of_month(current_date)
        
    return None

def _match_date_range_literal(lower_text: str, current_date: datetime, result: DateTimeRangeResult):
    date_regex = r"(?:từ\s+)?(\d{1,2})[/\-\.](\d{1,2})(?:[/\-\.](\d{2,4}))?"
    date_matches = list(re.finditer(date_regex, lower_text))

    def match_to_datetime(match: re.Match, current: datetime) -> Optional[datetime]:
        day = int(match.group(1))
        month = int(match.group(2))
        year = int(match.group(3)) if match.group(3) else current.year
        if len(str(year)) == 2: year += 2000
        try:
            target_date = start_of_day(datetime(year, month, day))
            if match.group(3) is None and target_date < start_of_day(current):
                target_date = start_of_day(datetime(year + 1, month, day))
            return target_date
        except ValueError:
            return None

    if len(date_matches) >= 2 and ("đến" in lower_text or "tới" in lower_text):
        start_date_time = match_to_datetime(date_matches[0], current_date)
        end_date_time = match_to_datetime(date_matches[1], current_date)
        if start_date_time and end_date_time:
            result["start_time"] = start_date_time
            result["end_time"] = end_date_time
    elif len(date_matches) == 1 and not result.get("start_time"):
        date_time = match_to_datetime(date_matches[0], current_date)
        if date_time:
            result["start_time"] = date_time

def _match_time(lower_text: str, current_date: datetime, base_date: Optional[datetime], result: DateTimeRangeResult):
    time_match = re.search(r"\b(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?\b", lower_text)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0

        if ("tối" in lower_text or "chiều" in lower_text) and hour < 12:
            hour += 12

        target_base_date = base_date or start_of_day(current_date)
        
        if result.get("start_time"):
            target_base_date = start_of_day(result["start_time"])
        elif result.get("end_time"):
            target_base_date = start_of_day(result["end_time"])


        target_time = target_base_date.replace(
            hour=hour, minute=minute, second=0, microsecond=0
        )

        if base_date is None and target_time < current_date:
            target_time = target_time + timedelta(days=1)

        result["end_time"] = target_time

def _match_buoi(lower_text: str, current_date: datetime, result: DateTimeRangeResult):
    BUOI_MAP: Dict[str, int] = {"sáng": 8, "trưa": 12, "chiều": 15, "tối": 20}
    
    for buoi, hour in BUOI_MAP.items():
        if f"{buoi} mai" in lower_text:
            target_date = start_of_day(current_date + timedelta(days=1))
            result["start_time"] = target_date.replace(hour=hour)
            return

        if buoi in lower_text and "sau" not in lower_text:
            base_dt = result.get("start_time") or result.get("end_time") or start_of_day(current_date)
            base_date = start_of_day(base_dt)
            
            target_time = base_date.replace(hour=hour, minute=0, second=0, microsecond=0)
            
            if base_date.date() == current_date.date() and target_time < current_date:
                base_date = start_of_day(current_date + timedelta(days=1))
                target_time = base_date.replace(hour=hour)

            result["start_time"] = target_time
            return

def detect_datetime_range(
    text: str, current_date: datetime = None
) -> DateTimeRangeResult:
    if current_date is None:
        current_date = datetime.now()

    lower_text = text.lower()
    result: DateTimeRangeResult = {
        "date": None, "time": None, "duration_minutes": None,
        "start_time": None, "end_time": None, "before_time": None, "after_time": None
    }
    base_date = _get_relative_date(lower_text, current_date)
    
    if base_date and ("cuối tháng" in lower_text or "hết tháng" in lower_text):
        result["end_time"] = end_of_month(current_date)
    elif base_date:
        pass 
        

    quarter_match = re.search(
        r"\bquý\s+(i{1,3}|iv|1|2|3|4)\s+(?:năm\s+(\d{4}))?", lower_text
    )
    
    if quarter_match:
        q_str = quarter_match.group(1).upper()
        year = (
            int(quarter_match.group(2)) if quarter_match.group(2) else current_date.year
        )

        quarter_map = {
            "I": 1,
            "1": 1,
            "II": 2,
            "2": 2,
            "III": 3,
            "3": 3,
            "IV": 4,
            "4": 4,
        }
        q_num = quarter_map.get(q_str, None)

        if q_num is not None:
            start_month = (q_num - 1) * 3 + 1
            start_of_quarter = datetime(year, start_month, 1)

            end_month = start_month + 2
            end_year = year
            if end_month > 12:
                end_month -= 12
                end_year += 1

            end_of_quarter = end_of_month(datetime(end_year, end_month, 1))

            result["start_time"] = start_of_day(start_of_quarter)
            result["end_time"] = start_of_day(end_of_quarter)

    _match_date_range_literal(lower_text, current_date, result)

    has_specific_hour = _has_specific_hour(lower_text)
    if not result.get("start_time") and not has_specific_hour:
        _match_buoi(lower_text, current_date, result)

    _match_time(lower_text, current_date, base_date, result)
        
    before_after_match = re.search(
        r"(trước|sau)\s+(?:(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?|\s+(\d{1,2})\s*(tháng|năm))",
        lower_text,
    )

    if before_after_match:
        modifier = before_after_match.group(1) 

        if before_after_match.group(2):
            hour = int(before_after_match.group(2))
            minute = (
                int(before_after_match.group(3)) if before_after_match.group(3) else 0
            )

            base_date = start_of_day(current_date)
            target_time = base_date.replace(hour=hour, minute=minute)

            if modifier == "trước":
                result["before_time"] = target_time
            elif modifier == "sau":
                result["after_time"] = target_time

        elif before_after_match.group(4):
            amount = int(before_after_match.group(4))
            unit = before_after_match.group(5)

            if unit == "tháng":
                target_date = datetime(current_date.year, amount, 1)
            elif unit == "năm":
                target_date = datetime(amount, 1, 1)

            if modifier == "trước":
                result["before_time"] = target_date
            elif modifier == "sau":
                result["after_time"] = target_date
    
    dur_match = re.search(
        r"(\d+)\s*(phút|tiếng|giờ|ngày)\s*(nữa|sau|trong)?", lower_text
    )

    if dur_match:
        amount = int(dur_match.group(1))
        unit = dur_match.group(2)
        is_relative = dur_match.group(3)

        duration_minutes: Optional[int] = None

        if "phút" in unit:
            duration_minutes = amount
        elif "tiếng" in unit or "giờ" in unit:
            duration_minutes = amount * 60
        elif "ngày" in unit:
            duration_minutes = amount * 24 * 60

        if duration_minutes is not None:
            if is_relative:
                absolute_time = current_date + timedelta(minutes=duration_minutes)
                result["end_time"] = absolute_time
            else:
                result["duration_minutes"] = duration_minutes
                if not result.get("end_time"):
                    result["end_time"] = start_of_day(current_date)

    if base_date and not result.get("start_time") and not result.get("end_time"):
        result["start_time"] = start_of_day(base_date)

    if result.get("start_time") is None:
        result["start_time"] = current_date + timedelta(minutes=30)

    return result

print("Loading SpaCy Model...")
try:
    nlp = spacy.load("vi_ner_task")
    print("SpaCy Model Loaded.")
except OSError:
    print("LỖI: Không tìm thấy model 'vi_ner_task'. SpaCy will be None.")
    nlp = None


RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
QUEUE_NAME = os.environ.get("QUEUE_NAME", "process_nlp") 
def process_task(text: str) -> Dict[str, Any]:
    text = text
    print(f"Processing text: {text}")
    doc = nlp(text)

    task = None
    date_text = None
    time_text = None
    priority = 3
    person = "Tôi"

    for ent in doc.ents:
        label = ent.label_.upper()
        print(f" - {ent.text} ({ent.label_})")
        if label == "TASK":
            task = ent.text
        elif label == "DATE":
            date_text = ent.text
        elif label == "TIME":
            time_text = ent.text
        elif label == "PERSON":
            person = ent.text

    if not task:
        task = text

    time_input = ""
    if date_text:
        time_input += date_text + " "
    if time_text:
        time_input += time_text

    priority = detect_priority(text)
    dt_result = detect_datetime_range(time_input)

    final_start_time: Optional[datetime] = dt_result.get("start_time")
    final_end_time: Optional[datetime] = dt_result.get("end_time")

    before_time = dt_result.get("before_time")
    after_time = dt_result.get("after_time")
    
    isDaily = "mỗi" in text.lower() or "hàng ngày" in text.lower() or "hàng tuần" in text.lower()

    if before_time:
        final_end_time = before_time

    if not final_start_time and after_time:
        final_start_time = after_time

    print(
        f"Task: {task}, Priority: {priority}, Start: {final_start_time}, End: {final_end_time}"
    )
    
    return {
        "task": task,
        "priority": priority,
        "startTime": final_start_time.isoformat() if final_start_time else None,
        "endTime": final_end_time.isoformat() if final_end_time else None,
        "person": person,
        "isDaily": isDaily,
        "durationMinutes": dt_result.get("duration_minutes"),
    }

def callback(ch, method, properties, body):
    reply_to = properties.reply_to
    corr_id = properties.correlation_id    
    response_payload = {"response": None, "isDisposed": True, "err": "Error during processing."}
    
    try:
        message = body.decode('utf-8')
        print(f"-> RECEIVED MESSAGE: {message}") 
        data = json.loads(message)
        
        pattern = data.get("pattern")
        text_input = data.get('data')

        if pattern != "parse_text":
            raise ValueError(f"Message pattern mismatch: expected 'parse_text', got {pattern}")
        
        if not text_input or not isinstance(text_input, str):
            raise ValueError("Input text is missing or invalid.")

        result = process_task(text_input) 
        
        print("-> PROCESSED RESULT:", result)

        response_payload = {
            "response": result, 
            "isDisposed": True,
            "err": None
        }

    except Exception as e:
        print(f"LỖI XỬ LÝ: {e}")
        response_payload["err"] = str(e)
    
    finally:
        if reply_to and corr_id:
            try:
                ch.basic_publish(
                    exchange='',
                    routing_key=reply_to,
                    properties=pika.BasicProperties(
                        correlation_id=corr_id
                    ),
                    body=json.dumps(response_payload, ensure_ascii=False).encode('utf-8')
                )
                print(f"<- SENT RESPONSE to {reply_to} with CorrID {corr_id}")
            except Exception as e:
                print(f"LỖI GỬI PHẢN HỒI: {e}")
        else:
            print("CẢNH BÁO: Thiếu reply_to hoặc corr_id. Không thể gửi phản hồi về NestJS.")

        ch.basic_ack(delivery_tag=method.delivery_tag)
        
def start_consumer():
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()

        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        print(f' [*] Đang chờ tin nhắn trên queue "{QUEUE_NAME}". Nhấn CTRL+C để thoát.')

        channel.basic_qos(prefetch_count=1) 
        
        channel.basic_consume(
            queue=QUEUE_NAME,
            on_message_callback=callback
        )

        channel.start_consuming()

    except pika.exceptions.AMQPConnectionError as e:
        print(f"LỖI KẾT NỐI RABBITMQ: {e}")
        print("Đảm bảo RabbitMQ server đang chạy và host/cổng là chính xác.")
    except KeyboardInterrupt:
        print("Consumer dừng lại.")
        if 'connection' in locals() and connection.is_open:
            connection.close()

if __name__ == '__main__':
    start_consumer()
