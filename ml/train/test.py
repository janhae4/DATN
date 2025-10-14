import spacy
from spacy import displacy


nlp = spacy.load("output_model/model-last")

# text_to_test = "Gấp, viết báo cáo tài chính lúc 10h sáng ngày mai"
list_text = [
  "Cần thiết, chuẩn bị thuyết trình dự án lúc từ 1 giờ chiều đến 5 giờ chiều mai.",
  "Khẩn cấp, kiểm tra kho hàng tồn lúc từ 9 giờ sáng ngày kia đến hết 12 giờ trưa.",
  "Ưu tiên, xử lý các hợp đồng đang chờ từ 14h chiều hôm nay đến 16h chiều.",
  "Quan trọng, làm việc với nhà cung cấp lúc từ thứ Năm tuần này đến hết thứ Sáu.",
  "Gấp, phân bổ lại ngân sách từ 10 giờ sáng đến 11 giờ sáng ngày mốt."
]


for i, text_to_test in enumerate(list_text):
    doc = nlp(text_to_test)

    print(f"{i} - Text: {text_to_test}")
    print("Entities found:")
    for ent in doc.ents:
        print(f" - {ent.text} ({ent.label_})")
    print("===========\n")
    displacy.render(doc, style="ent")
