from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import vi_task_ner  # thư viện tùy bạn đã build

app = FastAPI()

# Load mô hình
nlp = vi_task_ner.load()

class TextInput(BaseModel):
    text: str

class Task(BaseModel):
    person: Optional[List[str]] = None
    task: List[str]
    date: Optional[List[str]] = None
    time: Optional[List[str]] = None

@app.post("/predict", response_model=Task)
def predict(input_data: TextInput):
    doc = nlp(input_data.text)
    result = {
        "PERSON": [],
        "TASK": [],
        "DATE": [],
        "TIME": []
    }

    for ent in doc.ents:
        label = ent.label_.upper()
        if label in result:
            result[label].append(ent.text)
            
    return Task(
        person=result["PERSON"],
        task=result["TASK"],
        date=result.get("DATE", []),
        time=result.get("TIME", [])
    )
