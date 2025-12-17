"use client"

import * as React from "react"
import { Send, Sparkles, Loader2, User, BrainCircuit } from "lucide-react"
import { Components } from 'react-markdown'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// --- "NÂNG CẤP" IMPORTS (Giữ nguyên) ---
import ReactMarkdown from "react-markdown"       // "Thông dịch" Markdown
import rehypeRaw from "rehype-raw"              // "Thông dịch" HTML (nếu có)
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter' // "Tô màu" code
// --- SỬA STYLE: ĐỔI SANG STYLE "TỐI" XỊN HƠN ---
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism' // Style "tối" (giống VSCode)


// 1. Định nghĩa "Message" (Giữ nguyên)
interface Message {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
}

// 2. --- "ĐỘ" LẠI NÚT "MỒI" (CHO GIỐNG CLICKUP) ---
const PromptStarters = ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => {
    const prompts = [
        "Tóm tắt meeting hôm qua",
        "Việc nào đang 'dí' (urgent) nhất?",
        "Tạo 5 task cho 'Khóa luận tốt nghiệp'",
    ]

    return (
        // Bỏ `flex-col`, cho nó "inline"
        <div className="flex flex-wrap gap-2 my-4">
            {prompts.map((prompt) => (
                <Button
                    key={prompt}
                    variant="ghost" // <-- "GHOST" CHO NÓ TÀNG HÌNH
                    className="text-left justify-start text-gray-400 hover:text-white hover:bg-gray-700/50" // <-- "ĐỘ" MÀU
                    onClick={() => onPromptClick(prompt)}
                >
                    <Sparkles className="mr-2 h-4 w-4 flex-shrink-0 text-purple-400" /> {/* <-- THÊM MÀU CHO ICON */}
                    {prompt}
                </Button>
            ))}
        </div>
    )
}

// 3. --- COMPONENT "TÔ MÀU" MARKDOWN (ĐÃ "ĐỘ" DARK MODE) ---
const MarkdownRenderer = ({ text }: { text: string }) => {
    return (
        <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
                // "Độ" lại <a> (liên kết)
                a: ({ node, ...props }) => (
                    <a
                        className="text-blue-400 hover:text-blue-300 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                    />
                ),
                // "Độ" lại <ul> và <ol>
                ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 my-2 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />
                ),
                // "Độ" lại <blockquote>
                blockquote: ({ node, ...props }) => (
                    <blockquote
                        className="border-l-4 border-gray-500 pl-4 italic text-gray-300 my-2"
                        {...props}
                    />
                ),
                // "Độ" lại <table>
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-2">
                        <table className="border-collapse border border-gray-600" {...props} />
                    </div>
                ),
                th: ({ node, ...props }) => (
                    <th className="border border-gray-600 bg-gray-800 px-4 py-2 font-semibold" {...props} />
                ),
                td: ({ node, ...props }) => (
                    <td className="border border-gray-600 px-4 py-2" {...props} />
                ),
                // "Độ" lại <pre> (cho code block)
                pre: ({ node, ...props }) => (
                    <div className="my-2 bg-gray-950 rounded-lg overflow-hidden">
                        <pre {...props} />
                    </div>
                ),
                // "Độ" lại <code> (cho code block)
                code: ({ node, inline, className, children, ...props }: any) => {
                    if (inline) {
                        return (
                            <code className="bg-gray-700 text-red-400 font-mono px-1 py-0.5 rounded" {...props}>
                                {children}
                            </code>
                        )
                    }

                    const match = /language-(\w+)/.exec(className || '')
                    return (
                        <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match ? match[1] : 'text'}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    )
                }
            }}
        >
            {text}
        </ReactMarkdown>
    )
}


export default function AIAssistantUI() {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const streamIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, isLoading]);

    const handleSend = () => {
        if (input.trim() === "" || isLoading) return;

        // Dừng stream cũ (nếu có)
        if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: input,
        };

        // Thêm tin nhắn của User + Tin nhắn "rỗng" của AI
        const aiMessageId = `ai-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            userMessage,
            { id: aiMessageId, sender: 'assistant', text: "" } // AI "rỗng"
        ]);

        setInput("");
        setIsLoading(true);

        const fullResponse = `\`Easy game\`. Mày vừa hỏi tao: \`${userMessage.text}\`.


\`\`\`
`;

        const words = fullResponse.split(/(\s+)/); // Tách theo từ + khoảng trắng
        let wordIndex = 0;

        streamIntervalRef.current = setInterval(() => {
            if (wordIndex < words.length) {
                // Dùng functional update (cực quan trọng)
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === aiMessageId
                            ? { ...msg, text: msg.text + words[wordIndex] } // Nối từ
                            : msg
                    )
                );
                wordIndex++;
            } else {
                // Hết "stream"
                clearInterval(streamIntervalRef.current!);
                setIsLoading(false);
            }
        }, 50); // 50ms "nhả" 1 từ
        // --- Kết thúc giả lập ---
    };

    // Xử lý khi bấm nút "mồi" (Giữ nguyên)
    const handlePromptClick = (prompt: string) => {
        setInput(prompt);
    }

    // Xử lý bấm Enter (Giữ nguyên)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <TooltipProvider>
            {/* --- "ĐỘ" LẠI GIAO DIỆN CHÍNH (DARK MODE) --- */}
            <div className="flex flex-col h-[calc(100vh-100px)] max-h-[800px] w-full max-w-3xl mx-auto bg-gray-900 text-gray-100 rounded-lg border border-gray-700 shadow-xl">

                {/* Header (ĐÃ "ĐỘ" DARK MODE) */}
                <div className="flex items-center p-4 border-b border-gray-700">
                    <BrainCircuit className="h-6 w-6 text-purple-400" /> {/* <-- THÊM MÀU MÈ */}
                    <h2 className="text-xl font-semibold ml-2">AI Assistant</h2>
                </div>

                {/* Khung chat */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                        {/* Màn hình chào (ĐÃ "ĐỘ" DARK MODE) */}
                        {messages.length === 0 && (
                            <div className="text-center p-8">
                                <Avatar className="mx-auto h-16 w-16 mb-4">
                                    <AvatarFallback className="bg-gray-800 text-purple-400"> {/* <-- "ĐỘ" MÀU */}
                                        <Sparkles className="h-8 w-8" />
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-semibold">How can I help you today?</h3>
                                <p className="text-gray-400 mt-2"> {/* <-- "ĐỘ" MÀU */}
                                    Ask me to summarize tasks, draft emails, or manage your schedule.
                                </p>
                                <PromptStarters onPromptClick={handlePromptClick} />
                            </div>
                        )}

                        {/* Render tin nhắn */}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                {/* Avatar AI */}
                                {message.sender === 'assistant' && (
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback className="bg-gray-800 text-purple-400"> {/* <-- "ĐỘ" MÀU */}
                                            <Sparkles className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                {/* Bong bóng chat (ĐÃ "ĐỘ" DARK MODE) */}
                                <div
                                    className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${message.sender === 'user'
                                            ? 'bg-blue-600 text-white' // User giữ nguyên
                                            : 'bg-gray-800 text-gray-100' // <-- "ĐỘ" MÀU AI
                                        }`}
                                >
                                    {/* --- SỬ DỤNG MARKDOWN RENDERER --- */}
                                    {(message.text || message.text === "") && (message.text.length > 0) ? (
                                        <MarkdownRenderer text={message.text} />
                                    ) : (
                                        // Nếu "text" rỗng (lúc AI mới "vào")
                                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                    )}
                                </div>

                                {/* Avatar User */}
                                {message.sender === 'user' && (
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback className="bg-gray-700"> {/* <-- "ĐỘ" MÀU */}
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}

                        {/* Div neo để cuộn */}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Khung nhập liệu (ĐÃ "ĐỘ" DARK MODE) */}
                <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                    <div className="flex items-start gap-3">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about your tasks, meetings, or documents..."
                            className="flex-1 resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" // <-- "ĐỘ" MÀU
                            rows={2}
                            disabled={isLoading}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    onClick={handleSend}
                                    disabled={isLoading || input.trim() === ""}
                                    className="h-full" // Giữ nguyên, nút xanh (primary) là đẹp
                                >
                                    {/* Icon Sẽ tự update vì `isLoading` */}
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                    <span className="sr-only">Send message</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Send message (Enter)</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

