import React from "react";
import { Icon } from "@iconify-icon/react";

interface AISummaryBannerProps {
    isLoading: boolean;
    summary?: string | null;
    onClose?: () => void;
}

export const AISummaryBanner: React.FC<AISummaryBannerProps> = ({
    isLoading,
    summary,
    onClose,
}) => {
    if (!isLoading && !summary) return null;

    return (
        <div className="mb-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-sm p-3">
            <div className="flex items-start gap-2">
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                    {isLoading ? (
                        <Icon
                            icon="lucide:loader-2"
                            className="text-zinc-500 dark:text-zinc-400 animate-spin"
                            width="16"
                        />
                    ) : (
                        <Icon
                            icon="lucide:sparkles"
                            className="text-zinc-700 dark:text-zinc-300"
                            width="16"
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        AI Summary
                    </p>
                    {isLoading ? (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
                            Generating summary…
                        </p>
                    ) : (
                        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {summary}
                        </p>
                    )}
                </div>

                {/* Close button */}
                {!isLoading && (
                    <button
                        onClick={onClose}
                        className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                        aria-label="Close summary"
                    >
                        <Icon icon="lucide:x" width="14" />
                    </button>
                )}
            </div>
        </div>
    );
};
