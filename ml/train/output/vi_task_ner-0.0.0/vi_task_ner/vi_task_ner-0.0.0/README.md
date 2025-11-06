This is ner model for task

| Feature | Description |
| --- | --- |
| **Name** | `vi_task_ner` |
| **Version** | `0.0.0` |
| **spaCy** | `>=3.7.5,<3.8.0` |
| **Default Pipeline** | `tok2vec`, `ner` |
| **Components** | `tok2vec`, `ner` |
| **Vectors** | 0 keys, 0 unique vectors (0 dimensions) |
| **Sources** | n/a |
| **License** | n/a |
| **Author** | [Chánh Hỷ]() |

### Label Scheme

<details>

<summary>View label scheme (5 labels for 1 components)</summary>

| Component | Labels |
| --- | --- |
| **`ner`** | `DATE`, `LOCATION`, `PERSON`, `TASK`, `TIME` |

</details>

### Accuracy

| Type | Score |
| --- | --- |
| `ENTS_F` | 89.80 |
| `ENTS_P` | 89.80 |
| `ENTS_R` | 89.80 |
| `TOK2VEC_LOSS` | 19657.96 |
| `NER_LOSS` | 12221.95 |