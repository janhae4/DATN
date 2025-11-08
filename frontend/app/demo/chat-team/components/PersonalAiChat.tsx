// "use client";

// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { AiMessage, CurrentUser } from "../types/type";
// import { useChatStore } from "../store/useChatStore";
// import { useSocket } from "@/app/SocketContext";
// import { AiChatWindow } from "./AiChatWindow";
// import { useInfiniteScroll } from "../hooks/useInfiniteroll";
// import { useShallow } from "zustand/shallow";

// const EMPTY_MESSAGES: AiMessage[] = [];

// export function PersonalAiChat({ currentUser }: { currentUser: CurrentUser }) {
//   const { socket } = useSocket();
//   const chatboxRef = useRef<HTMLDivElement | null>(null);
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
//   const [isLoadingInitial, setIsLoadingInitial] = useState(true);
//   const {
//     loadInitialDiscussions,
//     loadMoreAiMessages,
//     sendAiMessage,
//     messages,
//     messagesLoaded,
//     isHistoryLoading,
//     hasMore,
//   } = useChatStore(
//     useShallow((state) => ({
//       messages: state.messages || EMPTY_MESSAGES,
//       messagesLoaded: state.messages !== undefined,
//       isHistoryLoading:
//       state.isHistoryLoading|| false,
//       hasMore: state.hasMoreMessages!== false,
//       loadInitialDiscussions: state.loadInitialDiscussions,
//       loadMoreAiMessages: state.loadMessages,
//       sendAiMessage: state.sendAiMessage,
//     }))
//   );

//   useEffect(() => {
//     if (!messagesLoaded) {
//       setIsLoadingInitial(true);
//       loadInitialDiscussions('ai').finally(
//         () => {
//           setIsLoadingInitial(false);
//         }
//       );
//     } else {
//       setIsLoadingInitial(false);
//     }
//   }, [messagesLoaded, currentUser]);

//   useEffect(() => {
//     if (!isLoadingInitial) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages.length, isLoadingInitial]);

//   const handleSend = () => {
//     if (socket) {
//       sendAiMessage( currentUser, socket);
//     }
//   };



//   useInfiniteScroll({
//     containerRef: chatboxRef,
//     endRef: messagesEndRef,
//     loadOlder: handleLoadMore,
//     count: messages.length,
//     isLoadingOlder: isHistoryLoading,
//   });

//   return (
//     <div className="flex-1 flex flex-col h-full">
//       <div className="p-4 bg-white shadow-sm">
//         <h2 className="text-xl font-semibold">AI Cá nhân</h2>
//         <p className="text-sm text-gray-500">
//           Cuộc trò chuyện này được cá nhân hóa cho riêng bạn.
//         </p>
//       </div>

//       <AiChatWindow
//         chatboxRef={chatboxRef}
//         messagesEndRef={messagesEndRef}
//         currentUser={currentUser}
//         isLoadingInitialMessages={isLoadingInitial}
//         handleSendAiMessage={handleSend}
//         handleLoadMoreMessages={handleLoadMore}
//       />
//     </div>
//   );
// }
