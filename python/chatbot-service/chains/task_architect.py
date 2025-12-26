import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from utils.stream_helper import stream_blocking_generator # Giả sử bạn đã tách hàm này ra utils

class TaskArchitect:
    def __init__(self, llm_service):
        self.llm_service = llm_service

    def _build_members_context(self, members):
        context = ""
        for m in members:
            history = [h.get('title') for h in m.get('history', [])]
            history_str = ", ".join(history) if history else "Chưa có dữ liệu"
            
            context += f"- Member ID: {m['id']}\n"
            context += f"  Tên: {m['name']}\n"
            context += f"  Kỹ năng (Bio): {m.get('bio', 'N/A')}\n"
            context += f"  Kinh nghiệm thực tế: {history_str}\n\n"
        return context

    async def suggest_and_assign(self, objective: str, members: list):
        members_context = self._build_members_context(members)

        prompt_template = """
            Bạn là Project Manager AI. Hãy phân công task dựa trên:
                1. Năng lực thực tế (Bio & History).
                2. Mong muốn phát triển (Target Skills) của thành viên trong project này.
                
            DƯỚI ĐÂY LÀ DANH SÁCH THÀNH VIÊN VÀ NĂNG LỰC:
            {members_context}

            YÊU CẦU CỦA NGƯỜI DÙNG:
            {user_query}

            QUY TẮC PHÂN CÔNG:
            1. Ưu tiên 70% task cho người đã có kinh nghiệm (History) để đảm bảo tiến độ.
            2. Dành 30% task (độ khó trung bình/thấp) cho người có 'Target Skills' trùng với task đó dù họ chưa có kinh nghiệm, để giúp họ mở rộng kỹ năng (extend).
            4. Dựa vào Lịch sử (Task History) để đánh giá kinh nghiệm thực tế. Ưu tiên giao task tương tự những gì họ đã làm tốt.
            5. Nếu một task đòi hỏi kỹ năng mà không ai có nổi bật, hãy giao cho người có kỹ năng gần nhất hoặc người có Bio là "Lead".
            6. Phân bổ đều khối lượng công việc, không dồn quá nhiều cho một người.

            ĐỊNH DẠNG PHẢN HỒI (MANDATORY):
            Trả về danh sách các task theo định dạng: 
            Tên Task | ID_Người_Được_Giao

            Ví dụ:
            Thiết kế giao diện login | dev-id-1
            Viết API xác thực người dùng | dev-id-2
        """
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm_service.get_llm() | StrOutputParser()

        def _blocking_stream(params):
            return chain.stream(params)

        async for chunk in stream_blocking_generator(_blocking_stream, {
            "members_context": members_context,
            "objective": objective
        }):
            yield chunk