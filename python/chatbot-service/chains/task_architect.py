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
                Ưu tiên 70% task cho người đã có kinh nghiệm (History) để đảm bảo tiến độ.
                Dành 30% task (độ khó trung bình/thấp) cho người có 'Target Skills' trùng với task đó dù họ chưa có kinh nghiệm, để giúp họ mở rộng kỹ năng (extend).
                Dựa vào Lịch sử (Task History) để đánh giá kinh nghiệm thực tế. Ưu tiên giao task tương tự những gì họ đã làm tốt.
                Nếu một task đòi hỏi kỹ năng mà không ai có nổi bật, hãy giao cho người có kỹ năng gần nhất hoặc người có Bio là "Lead".
                Phân bổ đều khối lượng công việc, không dồn quá nhiều cho một người.
                Nếu danh sách thành viên trống, hãy trả về Id người giao là người yếu cầu.

            """
        else:
            print(f"--> [SUGGEST TASK] Chế độ: Personal Roadmap")
            members_context = "N/A (Chế độ cá nhân)"
            assignment_rules = """
                Đây là kế hoạch cá nhân cho người dùng hiện tại.
                TẤT CẢ các task phải để ID_Người_Giao là "self".
                Cột Lý_Do hãy để trống.
            """
        
        prompt_template = """
            Bạn là Project Manager AI
            
            MỤC TIÊU: {{objective}}
                
            DƯỚI ĐÂY LÀ DANH SÁCH THÀNH VIÊN VÀ NĂNG LỰC:
            {members_context}

            YÊU CẦU CỦA NGƯỜI DÙNG:
            {objective}

            QUY TẮC PHÂN CÔNG:
            {assignment_rules}
            Ngày hiện tại là {current_date}. 
            Hãy tự động tính toán Thời_Gian_Bắt_Đầu và Thời_Gian_Kết_Thúc sao cho hợp lý với độ khó của task và trình tự thực hiện (Task sau bắt đầu sau task trước).
            Định dạng ngày phải là YYYY-MM-DD.

            ĐỊNH DẠNG PHẢN HỒI (MANDATORY):
            Mỗi task trả về trên một dòng duy nhất. KHÔNG GIẢI THÍCH GÌ THÊM.
            KHÔNG trả về markdown (không dùng dấu ```).
            KHÔNG có lời dẫn hay kết bài.
            Bắt đầu phân công ngay lập tức.
            Dựa trên chính xác id người giao từ danh sách thành viên đã cho.
            Trả về các dòng dữ liệu thuần túy, kết thúc mỗi dòng bằng dấu xuống dòng (\n).
            Trả về danh sách các task theo định dạng: 
            Tên_Task | ID_Người_Giao | Skill_Liên_Quan | EXP_Nhận_Được | Lý_Do_Phân_Công | Thời_Gian_Bắt_Dầu | Thời_Gian_Kết_Thúc

            Ví dụ:
            Thiết kế giao diện Login | uuid của người được giao  | Figma | 40 | Vì bạn có Target Skill là UI/UX | 2023-01-01 | 2023-02-01.
            Viết API xác thực | uuid của người được giao  | NodeJS | 60 | Vì bạn đã có kinh nghiệm làm Backend trước đó | 2023-01-01 | 2023-02-01.
        """
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm_service.get_llm() | StrOutputParser()
        
        print(f"--> [SUGGEST TASK] Gợi ý task với mục tiêu: {objective}")

        def _blocking_stream(params):
            return chain.stream(params)

        async for chunk in stream_blocking_generator(_blocking_stream, {
            "members_context": members_context,
            "objective": objective,
            "current_date": current_date,
            "assignment_rules": assignment_rules
        }):
            print(f"--> [SUGGEST TASK] Nhận được chunk: {chunk}")
            yield chunk