'use client';

import React from 'react';
import { X, Circle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface Toast {
    id: string;
    type: 'info' | 'success' | 'error' | 'recording';
    message: string;
}

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const icons = {
    info: <Info size={14} className="text-blue-400" />,
    success: <CheckCircle2 size={14} className="text-emerald-400" />,
    error: <AlertCircle size={14} className="text-red-400" />,
    recording: <Circle size={12} className="text-red-400 fill-red-400 animate-pulse" />,
};

const styles = {
    info: 'border-blue-500/20 bg-blue-500/8',
    success: 'border-emerald-500/20 bg-emerald-500/8',
    error: 'border-red-500/20 bg-red-500/8',
    recording: 'border-red-500/30 bg-red-500/10',
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full
                        bg-neutral-900/95 backdrop-blur-xl border shadow-xl shadow-black/40
                        animate-in fade-in slide-in-from-top-2 duration-300
                        ${styles[toast.type]}`}
                >
                    {icons[toast.type]}
                    <span className="text-sm font-medium text-white">{toast.message}</span>
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={10} />
                    </button>
                </div>
            ))}
        </div>
    );
}
