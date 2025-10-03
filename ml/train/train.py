from collections import defaultdict
import json
import spacy
from spacy.tokens import DocBin
from spacy.training.example import Example
from spacy.util import minibatch, compounding
import random

from spacy.cli.train import train

def resolve_overlaps(candidate_spans):
    """Chọn một tập span không chồng lấn dựa trên priority key."""
    selected = []
    occupied = set()  # token indices already taken
    # sort candidates: best first
    sorted_cands = sorted(candidate_spans)
    for s in sorted_cands:
        token_range = range(s.start, s.end)
        if any(t in occupied for t in token_range):
            # conflict -> skip
            continue
        selected.append(s)
        for t in token_range:
            occupied.add(t)
    return selected

def safe_assign_ents(doc, spans):
    # Debug overlaps
    token_map = defaultdict(list)
    for sp in spans:
        for t_idx in range(sp.start, sp.end):
            token_map[t_idx].append(sp)

    overlaps_found = False
    for t_idx, overlap in token_map.items():
        if len(overlap) > 1:
            overlaps_found = True
            print(f"\n⚠️ DEV OVERLAP at token {t_idx} '{doc[t_idx].text}': {[sp.text for sp in overlap]}")

    if overlaps_found:
        resolved = resolve_overlaps(spans)
        try:
            doc.ents = resolved
        except:
            print("❌ Still failed assigning after resolve. Skipping this DEV sample.")
            return False
    else:
        try:
            doc.ents = spans
        except:
            print("❌ Failed to assign ents for DEV sample even without overlap. Skipping.")
            return False

    return True


# Tạo blank pipeline với transformer
nlp = spacy.blank("xx")  # multilingual model
transformer = nlp.add_pipe(
    "transformer", config={"model": {"name": "xlm-roberta-base"}}
)
ner = nlp.add_pipe("ner")

with open("data.json", "r", encoding="utf8") as f:
    DATA = json.loads(f.read())
    random.seed(2)
    random.shuffle(DATA)

    TRAIN_DATA = DATA[: int(len(DATA) * 0.9)]
    DEV_DATA = DATA[int(len(DATA) * 0.9) :]

    # Thêm nhãn TASK
    for _, annotations in DEV_DATA:
        for ent in annotations.get("entities"):
            ner.add_label(ent[2])

    doc_bin = DocBin()
    for index, (text, annotations) in enumerate(TRAIN_DATA):
        doc = nlp.make_doc(text)
        ents = []
        for start, end, label in annotations["entities"]:
            span = doc.char_span(start, end, label=label, alignment_mode="expand")
            if span is None:
                print(f"❌ Span NONE | [{start},{end}] '{text[start:end]}' ")
            else:
                ents.append(span)
        doc.ents = ents
        doc_bin.add(doc)

    doc_bin.to_disk("dev.spacy")

    dev_doc_bin = DocBin()
    for index, (text, annotations) in enumerate(DEV_DATA):
        doc = nlp.make_doc(text)
        spans = []
        for start, end, label in annotations["entities"]:
            span = doc.char_span(start, end, label=label, alignment_mode="expand")
            if span is None:
                print(f"❌ DEV Span NONE | [{start},{end}] '{text[start:end]}' ")
            else:
                spans.append(span)

        if safe_assign_ents(doc, spans):
            dev_doc_bin.add(doc)

        dev_doc_bin.to_disk("dev.spacy")


