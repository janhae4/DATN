import { Badge } from "@/components/ui/badge"

// --- SỬA INTERFACE: Thêm fileName ---
interface FileTypeBadgeProps {
  fileType?: string;
  fileName?: string; // <-- THÊM PROP MỚI
}

// --- SỬA LOGIC: "Thông minh" hơn, check cả đuôi file ---
const getBadgeStyle = (fileType: string, fileName: string): { className: string; label: string } => {
  const type = fileType.toLowerCase();
  const name = fileName.toLowerCase();

  // Ưu tiên check đuôi file trước, y như FilePreview
  if (name.endsWith(".pdf") || type === "application/pdf") {
    return {
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
      label: "PDF",
    };
  }
  if (name.endsWith(".docx") || type.includes("word") || type.includes("document")) {
    return {
      className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
      label: "Word",
    };
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || type.includes("excel") || type.includes("spreadsheet")) {
    return {
      className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
      label: "Excel",
    };
  }
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || type.startsWith("image/")) {
    return {
      className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
      label: "Image", // Label chung cho gọn
    };
  }
  if (name.endsWith(".pptx") || type.includes("powerpoint") || type.includes("presentation")) {
    return {
      className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
      label: "PPT",
    };
  }
  if (name.endsWith(".txt") || type.startsWith("text/plain")) {
    return {
      className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
      label: "Text",
    };
  }
  if (name.endsWith(".zip") || name.endsWith(".rar") || type.includes("zip") || type.includes("archive")) {
    return {
      className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
      label: "Zip", // Đổi thành Zip
    };
  }

  // Fallback cho mấy loại khác
  return {
    className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
    label: name.split('.').pop() || "File", // Lấy đuôi file
  };
};

// --- SỬA COMPONENT: Nhận và truyền prop mới ---
export const FileTypeBadge = ({ fileType = "unknown", fileName = "" }: FileTypeBadgeProps) => {
  const { className, label } = getBadgeStyle(fileType, fileName); // <-- Truyền cả 2

  return (
    <Badge 
      // Thêm class 'border' để nó hiện viền
      className={`uppercase border ${className}`} // Đổi thành uppercase cho "pro"
    >
      {label}
    </Badge>
  );
};

