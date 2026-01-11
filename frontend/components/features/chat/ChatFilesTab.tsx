import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileText, File } from "lucide-react";
import { Message } from "@/types/communication/discussion.interface";

interface ChatFilesTabProps {
  discussionId: string | null;
}

// export function ChatFilesTab({ discussionId }: ChatFilesTabProps) {
//   const { data: messages, isLoading } = useMessages(discussionId);

//   const files = React.useMemo(() => {
//     if (!messages) return [];
//     const allFiles: any[] = [];
//     messages.forEach((msg: Message) => {
//       if (msg.attachments && Array.isArray(msg.attachments)) {
//         msg.attachments.forEach((att: any) => {
//           allFiles.push({
//             ...att,
//             createdAt: msg.createdAt,
//             messageId: msg.id,
//           });
//         });
//       }
//     });
//     return allFiles;
//   }, [messages]);

//   if (isLoading) {
//     return (
//       <div className="p-4 text-center text-muted-foreground">
//         Loading files...
//       </div>
//     );
//   }

//   if (files.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
//         <File className="h-10 w-10 mb-2 opacity-20" />
//         <p className="text-sm">No files shared yet</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-2 m-0">
//       <div className="space-y-1">
//         {files.map((file, i) => (
//           <div
//             key={`${file.messageId}-${i}`}
//             className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors border border-transparent hover:border-border/50"
//             onClick={() => window.open(file.fileUrl, "_blank")}
//           >
//             <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
//               <FileText className="h-5 w-5" />
//             </div>
//             <div className="flex-1 overflow-hidden">
//               <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
//                 {file.fileName || "Unknown file"}
//               </p>
//               <p className="text-xs text-muted-foreground">
//                 {formatBytes(file.fileSize)} • {formatDate(file.createdAt)}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function ChatFilesTab({ discussionId }: ChatFilesTabProps) {}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
