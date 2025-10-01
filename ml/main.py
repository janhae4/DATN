from fastapi import FastAPI
from pydantic import BaseModel

import spacy 

app = FastAPI()
nlp = spacy.load("vi_ner_task")


class TextInput(BaseModel):
    text: str


@app.post("/predict")
def predict(input_data: TextInput):
    doc = nlp(input_data.text)
    return {"entities": [(ent.text, ent.label_) for ent in doc.ents]}
