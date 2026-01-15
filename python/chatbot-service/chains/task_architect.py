import asyncio
from datetime import datetime
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from utils.stream_helper import stream_blocking_generator

class TaskArchitect:
    def __init__(self, llm_service):
        self.llm_service = llm_service

    def _build_members_context(self, members):
        context = ""
        for m in members:
            skills_list = []
            for s in m.get('skills', []):
                skill_info = f"{s.get('skillName')} (Lvl: {s.get('level')}, Exp: {s.get('experience')})"
                skills_list.append(skill_info)
            
            skills_str = ", ".join(skills_list) if skills_list else "Chưa có dữ liệu kỹ năng"
            
            history = [h.get('title') for h in m.get('history', [])]
            history_str = ", ".join(history) if history else "Chưa có dữ liệu dự án"

            context += f"- Member ID: {m.get('id')}\n"
            context += f"  Tên: {m.get('name')}\n"
            context += f"  Kỹ năng chi tiết: {skills_str}\n"
            context += f"  Kinh nghiệm thực tế: {history_str}\n\n"
            
        return context

    async def suggest_and_assign(self, objective: str, members: list):
        print(f"--> [SUGGEST TASK] Xây dựng ngữ cảnh thành viên...")
        has_members = members is not None and len(members) > 0
        members_context = self._build_members_context(members)
        
        print(f"--> [SUGGEST TASK] Members Context:\n{members_context}")
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        if has_members:
            print(f"--> [SUGGEST TASK] Chế độ: Team Assignment")
            members_context = self._build_members_context(members)
            assignment_rules = """
                - CHẾ ĐỘ: TEAM ASSIGNMENT.
                - NGUỒN ID: Chỉ sử dụng các UUID có trong danh sách thành viên bên trên.
                - QUY TẮC: 70% dựa trên Kinh nghiệm (History), 30% dựa trên Kỹ năng mục tiêu (Target Skills).
                - CÂN BẰNG: Phân bổ đều khối lượng công việc, ưu tiên người có Bio là "Lead" cho task khó.
                - LÝ DO: Ghi ngắn gọn lý do tại sao người này được chọn (dựa trên Skill/History).
            """
        else:
            print(f"--> [SUGGEST TASK] Chế độ: Personal Roadmap")
            members_context = "User hiện tại (Cá nhân)"
            assignment_rules = """
                - CHẾ ĐỘ: PERSONAL ROADMAP.
                - NGUỒN ID: Luôn luôn trả về giá trị "self".
                - LÝ DO: Luôn luôn để trống (không ghi gì cả).
                - TỔNG QUAN: Tự xây dựng lộ trình học tập/làm việc tuần tự cho một người.
            """
        
        system_prompt = f"""
            ROLE: Senior Project Manager & System Architect AI.
            
            CONTEXT:
            - Objective: {objective}
            - Current Date: {current_date}
            - Team Members Context: 
            {members_context}

            ASSIGNMENT ALGORITHM:
            {assignment_rules}
            STRICT CONSTRAINTS (MANDATORY):
                1. Task Sequence: Các task phải có tính kế thừa. Task phụ thuộc phải bắt đầu SAU KHI task trước kết thúc ít nhất 1 ngày.
                2. Duration: Ước tính thời gian dựa trên độ khó (Dễ: 1-3 ngày, Trung bình: 4-7 ngày, Khó: 8-14 ngày).
                3. Assignment ID: 
                - Nếu Team Assignment: BẮT BUỘC sử dụng chính xác ID (UUID) từ danh sách thành viên. Không tự chế ID.
                - Nếu Personal Roadmap: BẮT BUỘC ghi giá trị "self".
                4. Formatting: 
                - Trả về mỗi task trên một dòng.
                - Phân cách bởi dấu '|'.
                - KHÔNG markdown, KHÔNG lời dẫn, KHÔNG dấu nháy, KHÔNG giải thích.
                5. Content: Skill_Liên_Quan phải trùng khớp hoặc gần nhất với 'Target Skills' hoặc 'History' của thành viên.            Trả về danh sách các task theo định dạng: 
            Tên_Task | ID_Người_Giao | Skill_Liên_Quan | EXP_Nhận_Được | Lý_Do_Phân_Công | Thời_Gian_Bắt_Dầu | Thời_Gian_Kết_Thúc

            Ví dụ:
            Thiết kế giao diện Login | uuid của người được giao  | Figma | 40 | Vì bạn có Target Skill là UI/UX | 2023-01-01 | 2023-02-01.
            Viết API xác thực | uuid của người được giao  | NodeJS | 60 | Vì bạn đã có kinh nghiệm làm Backend trước đó | 2023-01-01 | 2023-02-01.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Hãy lập kế hoạch cho mục tiêu: {objective}"}
        ]

        print(f"--> [SUGGEST TASK] Đang gọi LLM (Native Ollama)...")
        def run_chat_sync():
            return self.llm_service.chat(messages)
            
        stream = await asyncio.to_thread(run_chat_sync)
        print(f"--> [SUGGEST TASK] Gợi ý task với mục tiêu: {objective}")


        for chunk in stream:
            content = chunk.get('message', {}).get('content', '')
            if content:
                print(f"Chunk: {content}", end="", flush=True)
                yield content
