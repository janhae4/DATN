from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import spacy
import re
import vi_task_ner
from datetime import datetime, timedelta

app = FastAPI()


nlp = vi_task_ner.load()

# Priority keywords rule-based
PRIORITY_KEYWORDS = {
    3: [
        "gấp",
        "khẩn",
        "ưu tiên",
        "deadline",
        "ngay",
        "ngay lập tức",
        "phải làm liền",
        "hôm nay",
        "nay",
    ],
    2: ["nhớ", "đừng quên", "dự định", "nên làm", "mai"],
    1: ["để sau", "lúc rảnh", "không gấp", "lát nữa", "mốt"],
}


# Detect priority logic
def detect_priority(text, current_date=datetime.now()):
    text = text.lower()

    # 1. High priority keywords
    for score, keywords in PRIORITY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            if score == 3:
                return 3

    # 2. Time without date → assume today = high
    time_regex = r"\b(\d{1,2}h|\d{1,2}:\d{2})\b"
    has_time = re.search(time_regex, text)
    has_date = any(x in text for x in ["mai", "mốt", "thứ", "ngày", "chủ nhật"])
    if has_time and not has_date:
        return 3

    # 3. Today
    if "hôm nay" in text or "nay" in text:
        return 3

    # 4. Tomorrow
    if "mai" in text:
        return 2

    # 5. Day after tomorrow
    if "mốt" in text:
        return 1

    # 6. Default
    return 2

def detect_datetime_range(text, current_date=datetime.now()):
    text = text.lower()

    result = {"date": None, "time": None, "duration": None}

    # --- Detect DATE ---
    if "hôm nay" in text or "nay" in text:
        result["date"] = current_date
    if "ngày mai" in text or "mai" in text:
        result["date"] = current_date + timedelta(days=1)
    if "mốt" in text:
        result["date"] = current_date + timedelta(days=2)
    if "kia" in text:
        result["date"] = current_date + timedelta(days=3)

    # --- Detect TIME (giờ cụ thể) ---
    time_match = re.search(r"\b(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?\b", text)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0

        # Nếu có "tối" hoặc "chiều" mà giờ < 12 → +12h
        if ("tối" in text or "chiều" in text) and hour < 12:
            hour += 12

        result["time"] = current_date.replace(hour=hour, minute=minute, second=0)

    # --- Detect Duration (thời lượng như 15 phút nữa, 1 tiếng nữa) ---
    dur_match = re.search(r"(\d+)\s*(phút|tiếng|giờ)\s*(nữa|sau|trong)?", text)
    if dur_match:
        amount = int(dur_match.group(1))
        unit = dur_match.group(2)

        if unit in ["phút"]:
            result["duration"] = timedelta(minutes=amount)
        if unit in ["tiếng", "giờ"]:
            result["duration"] = timedelta(hours=amount)

        # Nếu duration mà không có date → assume today
        if not result["date"]:
            result["date"] = current_date

        # Nếu duration + time → convert thành absolute time
        if "nữa" in text or "sau" in text:
            result["time"] = current_date + result["duration"]

    # === Fuzzy Dates ===
    weekday = current_date.weekday()  # Monday = 0, Sunday = 6

    if "cuối tuần sau" in text:
        delta = (6 - weekday) + 7
        result["date"] = current_date + timedelta(days=delta)

    elif "cuối tuần" in text:
        delta = 6 - weekday
        result["date"] = current_date + timedelta(days=delta)

    elif "đầu tuần sau" in text:
        delta = (7 - weekday)
        result["date"] = current_date + timedelta(days=delta)

    elif "đầu tuần" in text:
        delta = -weekday
        result["date"] = current_date + timedelta(days=delta)

    elif "cuối tháng" in text or "hết tháng" in text:
        next_month = current_date.replace(day=28) + timedelta(days=4)
        last_day = next_month - timedelta(days=next_month.day)
        result["date"] = last_day

    elif "đầu tháng sau" in text:
        next_month = current_date.replace(day=28) + timedelta(days=4)
        first_day_next_month = next_month.replace(day=1)
        result["date"] = first_day_next_month

    elif "cuối năm" in text:
        result["date"] = datetime(current_date.year, 12, 31)

    elif "đầu năm sau" in text:
        result["date"] = datetime(current_date.year + 1, 1, 1)

    # === Buổi trong ngày ===
    BUOI_MAP = {
        "sáng": 8,
        "trưa": 12,
        "chiều": 15,
        "tối": 20
    }

    for buoi, hour in BUOI_MAP.items():
        if f"{buoi} mai" in text:
            result["date"] = current_date + timedelta(days=1)
            result["time"] = current_date.replace(hour=hour, minute=0, second=0)

        if f"{buoi} nay" in text or buoi in text:
            if not result["date"]:
                result["date"] = current_date
            result["time"] = current_date.replace(hour=hour, minute=0, second=0)

    return result


class TextInput(BaseModel):
    text: str

class Task(BaseModel):
    person: List[str]
    task: List[str]
    date: List[str]
    time: Optional[List[str]] = None

@app.post("/predict")
def predict(input_data: TextInput):
    doc = nlp(input_data.text)

    entity_dict = {}
    for ent in doc.ents:
        entity_dict.setdefault(ent.label_, []).append(ent.text)

    priority = detect_priority(input_data.text)
    datetime_info = detect_datetime_range(input_data.text)

    return {
        "entities": entity_dict,
        "priority": priority,
        "datetime_info": datetime_info 
    }

