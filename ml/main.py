import re
from datetime import datetime, timedelta
from typing import TypedDict, Optional, Literal, Dict, List, Any
from fastapi import FastAPI
from pydantic import BaseModel, Field
import calendar
import spacy

app = FastAPI(title="Task Intent and Priority Parser (Vietnamese)")
nlp = spacy.load("vi_ner_task")
PRIORITY_KEYWORDS: Dict[int, List[str]] = {
    5: ["gấp", "khẩn", "ngay lập tức", "phải làm liền"],
    4: ["ưu tiên", "deadline", "ngay", "hôm nay", "nay"],
    3: ["nhớ", "cần làm", "quan trọng", "dự định", "rất cần"],
    2: ["nên làm", "mai", "tuần này"],
    1: ["để sau", "lúc rảnh", "không gấp", "lát nữa", "mốt"],
}


class DateTimeRangeResult(TypedDict):
    date: Optional[datetime]
    time: Optional[datetime]
    duration_minutes: Optional[int]


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
                max_priority = score  # type: ignore

    time_regex = r"\b(\d{1,2}h|\d{1,2}:\d{2})\b"
    has_time = re.search(time_regex, lower_text)
    has_relative_date = any(
        x in lower_text for x in ["mai", "mốt", "thứ", "ngày", "chủ nhật"]
    )

    if (
        has_time or "hôm nay" in lower_text or "nay" in lower_text
    ) and max_priority < 4:
        max_priority = 4  # type: ignore

    if "mai" in lower_text and max_priority < 2:
        max_priority = 2  # type: ignore

    if "mốt" in lower_text and max_priority < 1:
        max_priority = 1  # type: ignore

    return max_priority


def detect_datetime_range(
    text: str, current_date: datetime = None
) -> DateTimeRangeResult:
    if current_date is None:
        current_date = datetime.now()

    lower_text = text.lower()
    result: DateTimeRangeResult = {"date": None, "time": None, "duration_minutes": None}

    if "hôm nay" in lower_text or "nay" in lower_text:
        result["date"] = start_of_day(current_date)
    elif "ngày mai" in lower_text or "mai" in lower_text:
        result["date"] = start_of_day(current_date + timedelta(days=1))
    elif "mốt" in lower_text:
        result["date"] = start_of_day(current_date + timedelta(days=2))
    elif "kia" in lower_text:
        result["date"] = start_of_day(current_date + timedelta(days=3))

    time_match = re.search(r"\b(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?\b", lower_text)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0

        if ("tối" in lower_text or "chiều" in lower_text) and hour < 12:
            hour += 12

        base_date = result["date"] if result["date"] else start_of_day(current_date)
        result["time"] = base_date.replace(
            hour=hour, minute=minute, second=0, microsecond=0
        )

        if not result["date"] and result["time"] < current_date:
            result["time"] = result["time"] + timedelta(days=1)

        result["date"] = start_of_day(result["time"])

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

        if is_relative and duration_minutes is not None:
            result["time"] = current_date + timedelta(minutes=duration_minutes)
            result["date"] = start_of_day(result["time"])
        else:
            result["duration_minutes"] = duration_minutes
            if not result["date"]:
                result["date"] = start_of_day(current_date)

    current_day_of_week = current_date.weekday()

    if "cuối tuần sau" in lower_text:
        days_until_sunday = (6 - current_day_of_week) + 7
        result["date"] = start_of_day(current_date + timedelta(days=days_until_sunday))
    elif "cuối tuần" in lower_text:
        days_until_sunday = 6 - current_day_of_week
        result["date"] = start_of_day(current_date + timedelta(days=days_until_sunday))
    elif "đầu tuần sau" in lower_text:
        days_until_monday = 7 - current_day_of_week
        result["date"] = start_of_day(current_date + timedelta(days=days_until_monday))
    elif "đầu tuần" in lower_text:
        days_until_monday = -current_day_of_week
        result["date"] = start_of_day(current_date + timedelta(days=days_until_monday))
    elif "tuần sau" in lower_text:
        result["date"] = current_date + timedelta(weeks=1)
    elif "cuối tháng" in lower_text or "hết tháng" in lower_text:
        result["date"] = end_of_month(current_date)

    BUOI_MAP: Dict[str, int] = {"sáng": 8, "trưa": 12, "chiều": 15, "tối": 20}

    for buoi, hour in BUOI_MAP.items():
        if f"{buoi} mai" in lower_text:
            target_date = start_of_day(current_date + timedelta(days=1))
            result["date"] = target_date
            result["time"] = target_date.replace(hour=hour)
        elif buoi in lower_text and "sau" not in lower_text:
            if not result["date"]:
                result["date"] = start_of_day(current_date)

            target_time = result["date"].replace(
                hour=hour, minute=0, second=0, microsecond=0
            )

            if (
                result["date"].date() == current_date.date()
                and target_time < current_date
            ):
                result["date"] = start_of_day(current_date + timedelta(days=1))
                target_time = result["date"].replace(hour=hour)

            result["time"] = target_time

    if result["date"] and result["time"]:
        result["date"] = result["date"].replace(
            hour=result["time"].hour,
            minute=result["time"].minute,
            second=result["time"].second,
            microsecond=0,
        )
        result["time"] = result["date"]

    task_text = text
    keywords_to_remove = [
        "hôm nay",
        "nay",
        "ngày mai",
        "mai",
        "mốt",
        "kia",
        "cuối tuần",
        "đầu tuần",
        "sáng",
        "trưa",
        "chiều",
        "tối",
        "tuần sau",
        "tháng sau",
        "năm sau",
    ]

    for kw in keywords_to_remove:
        task_text = task_text.replace(kw, "")

    task_text = re.sub(r"\b(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?\b", "", task_text)

    task_text = re.sub(
        r"(\d+)\s*(phút|tiếng|giờ|ngày)\s*(nữa|sau|trong)?", "", task_text
    )

    task_text = task_text.strip()

    if len(task_text) < 5:
        task_text = text

    return result, task_text


class TextInput(BaseModel):
    text: str = Field(..., example="Gấp, viết báo cáo tài chính lúc 10h sáng ngày mai")


class TextOutput(BaseModel):
    task: str = Field(
        ..., description="Nội dung chính của task sau khi tách các từ khóa thời gian."
    )
    priority: Literal[1, 2, 3, 4, 5] = Field(
        ..., description="Độ ưu tiên (1-5, 5 là cao nhất)."
    )
    deadline: Optional[str] = Field(
        None, description="Thời hạn hoàn thành (ISO 8601 format)."
    )
    duration_minutes: Optional[int] = Field(
        None, description="Thời lượng ước tính của task (tính bằng phút)."
    )


@app.post("/predict", response_model=TextOutput)
def predict(input_data: TextInput):
    doc = nlp(input_data.text)

    task = None
    date_text = None
    time_text = None
    priority = 3

    for ent in doc.ents:
        label = ent.label_.upper()
        if label == "TASK":
            task = ent.text
        elif label == "DATE":
            date_text = ent.text
        elif label == "TIME":
            time_text = ent.text

    if not task:
        task = input_data.text

    priority = detect_priority(input_data.text)

    time_input = ""
    if date_text:
        time_input += date_text + " "
    if time_text:
        time_input += time_text

    dt_result, _ = detect_datetime_range(time_input)

    deadline_dt = dt_result.get("time") or dt_result.get("date")
    deadline_str = deadline_dt.isoformat() if deadline_dt else None

    return TextOutput(
        task=task,
        priority=priority,
        deadline=deadline_str,
        duration_minutes=dt_result.get("duration_minutes"),
    )
