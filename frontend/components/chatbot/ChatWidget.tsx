'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Utility mặc định của shadcn

// --- Types ---
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export default function ChatWidget() {
    // --- State ---
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! How can I help you today?',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);

    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Logic ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const toggleChat = () => setIsOpen((prev) => !prev);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        // 1. User Message
        const newUserMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        // 2. Simulate Network Delay
        setTimeout(() => {
            const newBotMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm running on shadcn UI now. Dark mode ready!",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, newBotMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">

            {/* --- Chat Window --- */}
            {isOpen && (
                <Card className="flex w-full gap-0 flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in-0 duration-300 sm:h-[500px] sm:w-[380px] h-[50vh] border-border bg-background py-0">

                    {/* Header */}
                    <CardHeader className=" flex justify-between items-center p-4 pb-4! border-b ">
                       <div className='flex flex-row items-center gap-3 rounded-t-xl'>
                         <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
                                <AvatarImage src="/bot-avatar.png" alt="Bot" />
                                <AvatarFallback className="bg-primary-foreground text-primary font-bold">AI</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500  ring-primary"></span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold">Support Assistant</h3>
                            <span className="text-xs opacity-40">Online</span>
                        </div>

                       </div>
                        {/* Nút X thêm vào đây */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </CardHeader>

                    {/* Body (Message List) */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex  w-full flex-col gap-1 break-words",
                                    msg.sender === 'user' ? "self-end items-end" : "self-start items-start"
                                )}
                            >
                                <div className={cn('w-full',
                                    msg.sender === 'user'
                                        ? "flex justify-end"
                                        : "flex justify-start"
                                )}>

                                    <div
                                        className={cn(
                                            "rounded-2xl max-w-[85%] w-fit  px-4 py-2.5 text-sm shadow-sm",
                                            msg.sender === 'user'
                                                ? "rounded-tr-none bg-primary text-primary-foreground"
                                                : "rounded-tl-none bg-muted text-foreground border"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                </div>

                                <span
                                    className={cn(
                                        "text-[10px] text-muted-foreground px-1 opacity-70",
                                        msg.sender === 'user' ? "text-right" : "text-left"
                                    )}
                                >
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}

                        {/* Loading State */}
                        {isTyping && (
                            <div className="flex items-center gap-2 self-start">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px]">AI</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-muted px-4 py-3 text-foreground">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]"></span>
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]"></span>
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    {/* Footer (Input Area) */}
                    <CardFooter className="border-t p-3 pt-3! bg-background">
                        <form
                            onSubmit={handleSendMessage}
                            className="flex w-full items-center gap-2"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground shrink-0 rounded-full"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>

                            <Input
                                ref={inputRef}
                                className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                                placeholder="Ask me anything..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping}
                            />

                            <Button
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim() || isTyping}
                                className="shrink-0 rounded-full transition-all"
                            >
                                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* --- Launcher Button --- */}
            <Button
                onClick={toggleChat}
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95",
                    isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                )}
            >
                <div className="relative top-1 left-1 h-6 w-6 ">
                    <MessageCircle
                        className={cn(
                            "absolute inset-0 h-full w-full transition-all duration-300",
                            isOpen ? "scale-50 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"
                        )}
                    />
                    <X
                        className={cn(
                            "absolute inset-0 h-full w-full transition-all duration-300",
                            isOpen ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-90"
                        )}
                    />
                </div>
            </Button>
        </div>
    );
}