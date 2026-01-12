"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Terminal, ExternalLink, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CopyButton = ({ content }: { content: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
    );
};

export const MarkdownRenderer = ({ text }: { text: string }) => (
    <div className="markdown-content">
        <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            components={{
                code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match ? match[1] : "code";
                    const rawContent = String(children).replace(/\n$/, "");

                    return !inline ? (
                        <div className="rounded-xl overflow-hidden my-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl group/code">
                            <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center border-b border-zinc-200/50 dark:border-zinc-800/50">
                                <div className="flex items-center gap-2">
                                    <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        {language}
                                    </span>
                                </div>
                                <CopyButton content={rawContent} />
                            </div>
                            <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={language}
                                PreTag="div"
                                customStyle={{
                                    margin: 0,
                                    padding: "1.5rem",
                                    fontSize: "0.875rem",
                                    lineHeight: "1.6",
                                    backgroundColor: "transparent",
                                    scrollbarWidth: "thin",
                                }}
                                className="bg-zinc-950 dark:bg-[#0c0c0e] selection:bg-indigo-500/30"
                                {...props}
                            >
                                {rawContent}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code
                            className="bg-zinc-100 dark:bg-zinc-800/80 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium border border-zinc-200/50 dark:border-zinc-700/50"
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                p: ({ children }) => (
                    <p className="leading-7 mb-4 last:mb-0 text-[15px] text-zinc-700 dark:text-zinc-300">
                        {children}
                    </p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 mb-4 text-zinc-700 dark:text-zinc-300">
                        {children}
                    </ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 mb-4 text-zinc-700 dark:text-zinc-300">
                        {children}
                    </ol>
                ),
                li: ({ children, checked, ...props }: any) => {
                    if (checked !== null) {
                        return (
                            <li className="flex items-start gap-2 list-none -ml-4 my-1">
                                <div className={cn(
                                    "p-0.5 rounded transition-colors mt-0.5",
                                    checked ? "text-emerald-500" : "text-zinc-400"
                                )}>
                                    {checked ? <Check className="h-4 w-4 stroke-[3px]" /> : <div className="h-4 w-4 border-2 border-zinc-300 dark:border-zinc-600 rounded" />}
                                </div>
                                <span className={cn(checked && "line-through text-zinc-400 dark:text-zinc-500")}>
                                    {children}
                                </span>
                            </li>
                        );
                    }
                    return <li className="leading-relaxed">{children}</li>;
                },
                h1: ({ children }) => (
                    <h1 className="text-3xl font-extrabold mb-6 mt-10 first:mt-0 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mb-4 mt-8 first:mt-0 text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-xl font-bold mb-3 mt-6 first:mt-0 text-zinc-800 dark:text-zinc-100 italic">
                        {children}
                    </h3>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-500 pl-6 py-2 my-6 italic text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-r-2xl shadow-sm">
                        {children}
                    </blockquote>
                ),
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500 transition-all inline-flex items-center gap-1 group"
                    >
                        {children}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                ),
                table: ({ children }) => (
                    <div className="my-6 w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <table className="w-full border-collapse text-sm text-left">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                        {children}
                    </thead>
                ),
                th: ({ children }) => (
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                        {children}
                    </td>
                ),
                hr: () => (
                    <hr className="my-10 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_1px_rgba(255,255,255,0.1)]" />
                ),
            }}
        >
            {text}
        </ReactMarkdown>
    </div>
);
