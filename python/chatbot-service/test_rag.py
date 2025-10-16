import os
from rag_core import process_and_store_documents, ask_question_for_user

def run_test():
    """Chạy một kịch bản test hoàn chỉnh."""
    print("--- BẮT ĐẦU KỊCH BẢN TEST ---")

    TEST_USER_ID = "test_123"
    TEST_FILE_PATH = os.path.join("data", "test.txt")
    TEST_QUESTION = "Làm thế nào để xin nghỉ phép ở công ty ABC?"

    print(f"\n[TEST 1] Đang nạp tài liệu '{TEST_FILE_PATH}' cho người dùng '{TEST_USER_ID}'...")
    try:
        process_and_store_documents(user_id=TEST_USER_ID, file_path=TEST_FILE_PATH)
        print("✅ Nạp dữ liệu thành công!")
    except Exception as e:
        print(f"❌ Lỗi khi nạp dữ liệu: {e}")
        return

    print(f"\n[TEST 2] Đang hỏi câu hỏi cho người dùng '{TEST_USER_ID}'...")
    print(f"Câu hỏi: '{TEST_QUESTION}'")
    
    try:
        response_stream = ask_question_for_user(question=TEST_QUESTION, user_id=TEST_USER_ID)

        full_answer = ""
        print("\n--- KẾT QUẢ TỪ AI (STREAMING) ---")
        print("Bot: ", end="", flush=True)

        for chunk in response_stream:
            print(chunk, end="", flush=True)
            full_answer += chunk

        print("\n----------------------------------")

        if "online" in full_answer.lower() and "quản lý" in full_answer.lower():
            print("✅ KIỂM TRA THÀNH CÔNG: Câu trả lời chứa các từ khóa mong đợi.")
        else:
            print(f"⚠️ CẢNH BÁO: Câu trả lời có vẻ không khớp. \n   Nội dung: '{full_answer}'")

    except Exception as e:
        print(f"❌ Lỗi khi hỏi đáp: {e}")

    print("\n--- KẾT THÚC KỊCH BẢN TEST ---")

if __name__ == "__main__":
    run_test()