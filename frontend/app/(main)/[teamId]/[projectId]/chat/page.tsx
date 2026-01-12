"use client";

<<<<<<< HEAD
// import { useState } from "react";
// import {ChatSidebar} from "@/components/features/chat/ChatSidebar";
// import ChatArea from "@/components/features/chat/chatArea";
// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "@/components/ui/resizable";

// export default function ChatPage() {
//   const [isInfoOpen, setIsInfoOpen] = useState(false);
//   const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

//   return (
//     <ResizablePanelGroup
//       direction="horizontal"
//       className="w-full rounded-lg  border md:min-w-[450px] h-[calc(100vh-2rem)]"
//     >
//       <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="min-w-[250px] ">
//         <ChatSidebar
//           selectedDiscussionId={selectedDiscussionId}
//           onSelectDiscussion={setSelectedDiscussionId}
//         />
//       </ResizablePanel>
//       <ResizableHandle />
//       <ResizablePanel defaultSize={80}>
//         <ResizablePanelGroup direction="horizontal">
//           <ResizablePanel defaultSize={isInfoOpen ? 70 : 100} minSize={50}>
//             <ChatArea 
//               onToggleInfo={() => setIsInfoOpen(!isInfoOpen)} 
//               discussionId={selectedDiscussionId}
//             />
//           </ResizablePanel>
//           {isInfoOpen && (
//             <>
//               <ResizableHandle />
//               <ResizablePanel defaultSize={30} minSize={30}>
//                 <ChatInformation 
//                   discussionId={selectedDiscussionId} 
//                   onClose={() => setIsInfoOpen(false)}
//                 />
//               </ResizablePanel>
//             </>
//           )}
//         </ResizablePanelGroup>
//       </ResizablePanel>
//     </ResizablePanelGroup>
//   );
// }

export default function ChatPage() {}
=======
import { useState } from "react";
import ChatSidebar from "@/components/features/chat/ChatSidebar";
import ChatArea from "@/components/features/chat/chatArea";
import { ChatInformation } from "@/components/features/chat/ChatInformation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ChatPage() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full rounded-lg  border md:min-w-[450px] h-[calc(100vh-2rem)]"
    >
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="min-w-[250px] ">
        <ChatSidebar 
          selectedDiscussionId={selectedDiscussionId}
          onSelectDiscussion={setSelectedDiscussionId}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={isInfoOpen ? 70 : 100} minSize={50}>
            <ChatArea 
              onToggleInfo={() => setIsInfoOpen(!isInfoOpen)} 
              discussionId={selectedDiscussionId}
            />
          </ResizablePanel>
          {isInfoOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={30}>
                <ChatInformation 
                  discussionId={selectedDiscussionId} 
                  onClose={() => setIsInfoOpen(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
>>>>>>> origin/blank_branch
