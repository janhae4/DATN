import React, { useEffect, useState } from 'react';
import { Sparkles, X, RefreshCw, CheckCircle2, Loader2, Save, Users, Calendar, Trash2, Trash, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { videoChatService } from '@/services/videoChatService';
import apiClient from '@/services/apiClient'; // For missing endpoints
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AISummaryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    myCallRole?: string;
    streamContent?: string;
    isStreaming?: boolean;
}

export function AISummaryPanel({ isOpen, onClose, roomId, myCallRole, streamContent, isStreaming }: AISummaryPanelProps) {
    const [loading, setLoading] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [actionItems, setActionItems] = useState<any[]>([]);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingForm, setEditingForm] = useState<any>({});
    const { user } = useAuth();

    const fetchSummaryAndTasks = async () => {
        try {
            setLoading(true);
            const data: any = await videoChatService.getCallInfo(roomId);
            if (data) {
                // Last summary 
                if (data.callSummaryBlocks && data.callSummaryBlocks.length > 0) {
                    const lastSummary = data.callSummaryBlocks[data.callSummaryBlocks.length - 1];
                    setSummary(lastSummary);
                } else {
                    setSummary(null);
                }

                if (data.callActionItems) {
                    setActionItems(data.callActionItems);
                } else {
                    setActionItems([]);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Gặp lỗi khi tải AI Summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !isStreaming) {
            fetchSummaryAndTasks();
        }
    }, [isOpen, roomId]);

    useEffect(() => {
        if (isOpen && !isStreaming) {
            // Re-fetch when streaming ends
            fetchSummaryAndTasks();
        }
    }, [isStreaming, isOpen]);

    const handleTriggerSummary = async () => {
        try {
            setTriggering(true);
            // Wait for 1-2 seconds visually
            toast.info('Đang yêu cầu AI phân tích cuộc hội thoại...');
            await apiClient.post('/video-call/trigger-summary', { roomId });
            toast.success('AI phân tích thành công!');
            await fetchSummaryAndTasks();
        } catch (err) {
            console.error(err);
            toast.error('Gặp lỗi khi chạy AI Summary!');
        } finally {
            setTriggering(false);
        }
    };

    const handleSaveTask = async (taskId: string) => {
        try {
            toast.info('Lưu thay đổi task...');
            setActionItems(prev =>
                prev.map(item =>
                    item.id === taskId ? { ...item, ...editingForm } : item
                )
            );
            toast.success('Lưu task thành công!');
            setEditingTaskId(null);
        } catch (err) {
            toast.error('Gặp lỗi khi lưu task!');
        }
    };

    const handleRemoveTask = (taskId: string) => {
        setActionItems(prev => prev.filter(i => i.id !== taskId));
    };

    const handleAddAllToBacklog = () => {
        toast.info("Tính năng thêm tất cả vào backlog sẽ được cập nhật sớm");
    };

    const isPrivileged = myCallRole === 'HOST' || myCallRole === 'ADMIN';

    if (!isOpen) return null;

    return (
        <div className="w-80 h-full flex-shrink-0 bg-neutral-900/95 backdrop-blur-md border-l border-white/10 flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-800/50">
                <div className="flex items-center gap-2 text-amber-400 font-semibold shadow-amber-400/50">
                    <Sparkles size={18} />
                    <h2 className="text-sm tracking-wide">AI Summary</h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-neutral-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10">
                {isStreaming ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 text-neutral-200 text-sm p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                            <span className="font-semibold text-amber-400 flex items-center gap-2 mb-3">
                                <Loader2 className="animate-spin" size={14} /> AI đang phân tích hội thoại...
                            </span>
                            <div className="opacity-80 font-mono text-xs max-h-[300px] overflow-hidden">
                                {streamContent?.substring(Math.max(0, streamContent.length - 500))}
                                <span className="animate-pulse bg-white/50 w-2 h-3 inline-block ml-1"></span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tóm tắt chung</h3>
                            {loading ? (
                                <div className="text-sm text-neutral-500 flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={14} /> Tải tóm tắt...
                                </div>
                            ) : summary ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 text-neutral-200 text-sm p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                                    {summary.content}
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-500 italic">
                                    Chưa có dữ liệu tóm tắt cho phòng này.
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Tasks Assignments</h3>
                                {actionItems.length > 0 && isPrivileged && (
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setActionItems([])}
                                            className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                        >
                                            <Trash size={10} /> Clear
                                        </button>
                                        <button
                                            onClick={handleAddAllToBacklog}
                                            className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors shadow-sm shadow-amber-500/20"
                                        >
                                            <Plus size={10} /> Add All
                                        </button>
                                    </div>
                                )}
                            </div>
                            {loading ? (
                                <div className="text-sm text-neutral-500 flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={14} /> Tải tasks...
                                </div>
                            ) : actionItems.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {actionItems.map((item, idx) => (
                                        <div key={item.id || idx} className="bg-neutral-800/80 border border-white/5 p-3 rounded-xl hover:border-amber-500/30 transition-colors group relative">
                                            <div className="flex items-start gap-2">
                                                <CheckCircle2 size={16} className="text-amber-500 mt-1 shrink-0" />
                                                {editingTaskId === item.id ? (
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <textarea
                                                            placeholder="Nội dung công việc..."
                                                            className="w-full bg-neutral-900 border border-amber-500/50 rounded-md p-2 text-sm text-white resize-none focus:outline-none focus:border-amber-500"
                                                            value={editingForm.content || ""}
                                                            onChange={(e) => setEditingForm({ ...editingForm, content: e.target.value })}
                                                            rows={2}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Người thực hiện"
                                                            className="w-full bg-neutral-900 border border-amber-500/50 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                                            value={editingForm.assigneeId || ""}
                                                            onChange={(e) => setEditingForm({ ...editingForm, assigneeId: e.target.value })}
                                                        />
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="date"
                                                                className="w-full bg-neutral-900 border border-amber-500/50 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                                                value={editingForm.startDate?.split('T')[0] || ""}
                                                                onChange={(e) => setEditingForm({ ...editingForm, startDate: e.target.value })}
                                                            />
                                                            <input
                                                                type="date"
                                                                className="w-full bg-neutral-900 border border-amber-500/50 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                                                value={editingForm.endDate?.split('T')[0] || ""}
                                                                onChange={(e) => setEditingForm({ ...editingForm, endDate: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingTaskId(null)}>Hủy</Button>
                                                            <Button size="sm" className="h-6 px-2 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleSaveTask(item.id)}>Lưu</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col gap-y-1">
                                                        <p className="text-sm text-neutral-200 leading-snug break-words">{item.content}</p>
                                                        {(item.assigneeId || item.startDate || item.endDate) && (
                                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-neutral-400">
                                                                {item.assigneeId && (
                                                                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                                                                        <Users size={10} />
                                                                        <span>{item.assigneeId}</span>
                                                                    </div>
                                                                )}
                                                                {(item.startDate || item.endDate) && (
                                                                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                                                                        <Calendar size={10} />
                                                                        <span>
                                                                            {item.startDate ? item.startDate.split('T')[0] : "..."} - {item.endDate ? item.endDate.split('T')[0] : "..."}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center mt-2">
                                                            <button
                                                                className="text-[10px] font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
                                                                onClick={() => toast.info("Tính năng thêm vào backlog sẽ được cập nhật sớm")}
                                                            >
                                                                Add to Backlog
                                                            </button>
                                                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-white/5 text-[9px] uppercase font-semibold text-neutral-500">
                                                                {item.status || 'SUGGESTED'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {isPrivileged && editingTaskId !== item.id && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800/80 p-1 rounded backdrop-blur">
                                                    <button
                                                        className="text-neutral-500 hover:text-amber-400 p-1 transition-colors"
                                                        onClick={() => {
                                                            setEditingTaskId(item.id);
                                                            setEditingForm(item);
                                                        }}
                                                        title="Chỉnh sửa task"
                                                    >
                                                        <Save size={12} className="hidden" />
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                                                        onClick={() => handleRemoveTask(item.id)}
                                                        title="Xóa task"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-500 italic">
                                    Chưa có cấu trúc Task được trích xuất.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 border-t border-white/10 bg-neutral-900">
                <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-lg shadow-amber-500/20 disabled:bg-amber-500/50"
                    onClick={handleTriggerSummary}
                    disabled={triggering || isStreaming}
                >
                    {triggering ? <Loader2 size={18} className="animate-spin mr-2" /> : <RefreshCw size={18} className="mr-2" />}
                    Lấy tóm tắt mới nhất
                </Button>
            </div>
        </div>
    );
}
