
import { cn } from "@/lib/utils";

export const AudioWaveform = ({ active }: { active: boolean }) => {
    return (
        <div className="flex items-end gap-[3px] h-3.5">
            {[1, 2, 3, 4].map((bar) => (
                <div
                    key={bar}
                    className={cn(
                        "w-[3px] rounded-full transition-all duration-300",
                        active ? "animate-music-bar bg-black dark:bg-white" : "h-[3px] bg-zinc-200 dark:bg-zinc-700 opacity-40"
                    )}
                    style={{
                        animationDelay: `${bar * 0.15}s`,
                        height: active ? undefined : "3px"
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes music-bar {
                    0% { height: 20%; }
                    50% { height: 100%; }
                    100% { height: 20%; }
                }
                .animate-music-bar {
                    animation: music-bar 0.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
