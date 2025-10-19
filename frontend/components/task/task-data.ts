import { Task } from "@/lib/types/task.type"
import { User } from "@/lib/types/user.type"

const users: User[] = [
    { id: "user-1", name: "Son Goku", avatarFallback: "SG" },
    { id: "user-2", name: "Jane Doe", avatarFallback: "JD" },
    { id: "user-3", name: "Alex Smith", avatarFallback: "AS" },
    { id: "user-4", name: "Lisa Ray", avatarFallback: "LR" },
]

export const initialData: Task[] = [
    {
        id: "TASK-8782",
        title: "Thiết kế ",
        description: "Thiết kế giao diện người dùng cho ứng dụng web mới",
        isCompleted: true,
        status: "in_progress",
        priority: "high",
        assignees: [users[0], users[1], users[2]],
        subtasks: [{ id: "sub-1" }, { id: "sub-2" }],
        due_date: "2025-10-20",
    },
    {
        id: "TASK-7878",
        title: "Gọi điện cho khách hàng X",
        description: "Liên hệ và tư vấn khách hàng về sản phẩm mới",
        isCompleted: false,
        status: "todo",
        priority: "medium",
        assignees: [users[1]],
        subtasks: [],
        due_date: null,
    },
    {
        id: "TASK-1234",
        title: "Nộp báo cáo tuần",
        description: "Chuẩn bị và nộp báo cáo tiến độ tuần này",
        isCompleted: false,
        status: "done",
        priority: "low",
        assignees: [],
        subtasks: [{ id: "sub-1"}],
        due_date: "2025-10-18",
    },
    {
        id: "TASK-5678",
        title: "Nộp báo cáo tuần",
        description: "Xem xét và phê duyệt báo cáo từ team",
        isCompleted: false,
        status: "done",
        priority: "low",
        assignees: [users[3], users[2]],
        subtasks: [],
        due_date: "2025-10-18",
    },
]
