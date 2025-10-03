from fastapi import FastAPI
from pydantic import BaseModel
import spacy
import re
from datetime import datetime, timedelta

app = FastAPI()

# Load SpaCy model
nlp = spacy.load("vi_ner_task")

# Priority keywords rule-based
PRIORITY_KEYWORDS = {
    3: ["gấp", "khẩn", "ưu tiên", "deadline", "ngay", "ngay lập tức", "phải làm liền", "hôm nay", "nay"],
    2: ["nhớ", "đừng quên", "dự định", "nên làm", "mai"],
    1: ["để sau", "lúc rảnh", "không gấp", "lát nữa", "mốt"]
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


class TextInput(BaseModel):
    text: str


@app.post("/predict")
def predict(input_data: TextInput):
    doc = nlp(input_data.text)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    priority = detect_priority(input_data.text)
    return {"entities": entities, "priority": priority}
