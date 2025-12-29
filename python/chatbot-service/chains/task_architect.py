import asyncio
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
        members_context = self._build_members_context(members)
        
        print(f"--> [SUGGEST TASK] Members Context:\n{members_context}")

        prompt_template = """
            Bạn là Project Manager AI. Hãy phân công task dựa trên:
                1. Năng lực thực tế (Bio & History).
                2. Mong muốn phát triển (Target Skills) của thành viên trong project này.
                
            DƯỚI ĐÂY LÀ DANH SÁCH THÀNH VIÊN VÀ NĂNG LỰC:
            {members_context}

            YÊU CẦU CỦA NGƯỜI DÙNG:
            {objective}

            QUY TẮC PHÂN CÔNG:
            1. Ưu tiên 70% task cho người đã có kinh nghiệm (History) để đảm bảo tiến độ.
            2. Dành 30% task (độ khó trung bình/thấp) cho người có 'Target Skills' trùng với task đó dù họ chưa có kinh nghiệm, để giúp họ mở rộng kỹ năng (extend).
            4. Dựa vào Lịch sử (Task History) để đánh giá kinh nghiệm thực tế. Ưu tiên giao task tương tự những gì họ đã làm tốt.
            5. Nếu một task đòi hỏi kỹ năng mà không ai có nổi bật, hãy giao cho người có kỹ năng gần nhất hoặc người có Bio là "Lead".
            6. Phân bổ đều khối lượng công việc, không dồn quá nhiều cho một người.
            7. Nếu danh sách thành viên trống, hãy trả về Id người giao là người yếu cầu.

            ĐỊNH DẠNG PHẢN HỒI (MANDATORY):
            Mỗi task trả về trên một dòng duy nhất. KHÔNG GIẢI THÍCH GÌ THÊM.
            KHÔNG trả về markdown (không dùng dấu ```).
            KHÔNG có lời dẫn hay kết bài.
            Bắt đầu phân công ngay lập tức.
            Dựa trên chính xác id người giao từ danh sách thành viên đã cho.
            Trả về các dòng dữ liệu thuần túy, kết thúc mỗi dòng bằng dấu xuống dòng (\n).
            Trả về danh sách các task theo định dạng: 
            Tên_Task | ID_Người_Giao | Skill_Liên_Quan | EXP_Nhận_Được | Lý_Do_Phân_Công

            Ví dụ:
            Thiết kế giao diện Login | uuid của người được giao  | Figma | 40 | Vì bạn có Target Skill là UI/UX.
            Viết API xác thực | uuid của người được giao  | NodeJS | 60 | Vì bạn đã có kinh nghiệm làm Backend trước đó.
        """
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm_service.get_llm() | StrOutputParser()
        
        print(f"--> [SUGGEST TASK] Gợi ý task với mục tiêu: {objective}")

        def _blocking_stream(params):
            return chain.stream(params)

        async for chunk in stream_blocking_generator(_blocking_stream, {
            "members_context": members_context,
            "objective": objective
        }):
            print(f"--> [SUGGEST TASK] Nhận được chunk: {chunk}")
            yield chunk