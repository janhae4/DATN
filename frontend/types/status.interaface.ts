export enum statusEnum {
  todo = "todo",
  in_progress = "in_progress",
  done = "done",
}

export interface Status {
  id: string;
  name: string; // Ví dụ: "In Review", "Testing"
  color: string; // Ví dụ: "#FFCC00"
  order: number; // Thứ tự hiển thị trong danh sách trạng thái (drag and drop)
  status: statusEnum;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
