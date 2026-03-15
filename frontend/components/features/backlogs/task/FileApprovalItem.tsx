"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IFile } from "@/services/fileService";
import { format } from "date-fns";
import { Calendar, Check, X, HardDrive, Eye } from "lucide-react";
import React from 'react';
import { cn } from "@/lib/utils";
import { getFileTheme } from "@/components/features/documentation/file-card";

export function FileApprovalItem({
    file,
    memberMap,
    onApprove,
    onReject,
    onPreview,
    isUpdating
}: {
    file: IFile;
    memberMap: Record<string, any>;
    onApprove: (e: React.MouseEvent) => void;
    onReject: (e: React.MouseEvent) => void;
    onPreview: (file: IFile) => void;
    isUpdating: boolean;
}) {
    const reporter = memberMap[file.userId || ""] || null;
    const reporterName = reporter?.cachedUser?.name || reporter?.name || "Unknown User";
    const reporterAvatar = reporter?.cachedUser?.avatar || reporter?.avatar;

    const formatFileSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype: string, name: string) => {
        const theme = getFileTheme(mimetype, name);
        const Icon = theme.icon;
        return (
            <div className={cn("p-2 rounded-md border border-border/50", theme.bg, theme.color)}>
                <Icon className="h-5 w-5" />
            </div>
        );
    };

    const formatMimeType = (mimetype: string) => {
        if (!mimetype) return 'FILE';
        if (mimetype.includes('officedocument.wordprocessingml.document')) return 'DOCX';
        if (mimetype.includes('officedocument.spreadsheetml.sheet')) return 'XLSX';
        if (mimetype.includes('officedocument.presentationml.presentation')) return 'PPTX';
        const parts = mimetype.split('/');
        let type = parts[1] || parts[0] || 'FILE';
        return type.toUpperCase();
    };

    return (
        <div className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start gap-3">
                    {getFileIcon(file.mimetype, file.originalName)}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate text-foreground leading-normal" title={file.originalName}>
                            {file.originalName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded border border-border/40 max-w-[80px] truncate" title={file.mimetype}>
                                {formatMimeType(file.mimetype)}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <HardDrive className="h-2.5 w-2.5" />
                                {formatFileSize(file.size)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/80 flex-wrap">
                    {/* Uploader */}
                    <div className="flex items-center gap-1.5 min-w-0" title={`Uploaded by ${reporterName}`}>
                        <Avatar className="h-4 w-4 border border-border/50">
                            <AvatarImage src={reporterAvatar} />
                            <AvatarFallback className="text-[8px] bg-muted/50 text-muted-foreground">
                                {reporterName?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px]">{reporterName}</span>
                    </div>

                    <div className="h-3 w-px bg-border/60" />

                    {/* Created Date */}
                    {file.createdAt && (
                        <div className="flex items-center gap-1.5" title="Uploaded date">
                            <Calendar className="h-3 w-3 opacity-70" />
                            <span>{format(new Date(file.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 sm:border-l sm:pl-3 border-border/40">
                 <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5 mr-1"
                    onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                    title="Preview File"
                >
                    <Eye className="h-4 w-4" />
                </Button>

                 <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all duration-200"
                    onClick={onReject}
                    disabled={isUpdating}
                    title="Reject File"
                >
                    <X className="h-4 w-4 mr-1.5" />
                    <span className="sr-only sm:not-sr-only text-xs">Reject</span>
                </Button>
                <Button
                    size="sm"
                    className="h-8 px-3 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm transition-all"
                    onClick={onApprove}
                    disabled={isUpdating}
                    title="Approve File"
                >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">Approve</span>
                </Button>
            </div>
        </div>
    );
}
