import React, { useEffect, useState } from 'react';
import { Users, Clock } from 'lucide-react';

interface MeetingHeaderProps {
    roomId: string;
    participantCount: number;
    startTime?: Date;

}

export const MeetingHeader = ({ roomId, participantCount, startTime: initialStartTime }: MeetingHeaderProps) => {

    const [startTime] = useState(initialStartTime || new Date());
    const [duration, setDuration] = useState('00:00:00');
    useEffect(() => {
        // Update duration every second
        const timer = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();

            // Calculate hours, minutes, seconds
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Format as HH:MM:SS
            const formattedTime = [
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':');

            setDuration(formattedTime);
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);
    return (
        <div
            className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-6 pointer-events-none"
        >
            {/* Thông tin phòng - Góc Trái (Minimalism) */}
            <div className="ml-3 mt-2 pointer-events-auto flex items-center gap-3">
                {/* Tên phòng gọn gàng */}
                <div className="flex flex-col">
                    <h1 className="text-lg font-semibold text-white/90 tracking-tight drop-shadow-sm flex items-center gap-2">
                        Taskora Meeting <span className="text-white/60 font-normal">|</span> <span className="text-white/80 font-mono text-base">{roomId}</span>
                    </h1>

                    {/* Thời gian siêu nhỏ, mờ */}
                    <div className="flex items-center gap-1.5 text-white/70 text-[15px] font-medium pl-0.5 mt-0.5">
                        <Clock size={10} />
                        <span>{duration}</span>
                    </div>
                </div>
            </div>

            {/* Số lượng người tham gia - Góc Phải */}
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-neutral-900/40 backdrop-blur-md rounded-full border border-white/5 shadow-sm hover:bg-neutral-900/60 transition-colors cursor-pointer group">
                <div className="p-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <Users size={14} className="text-white/80" />
                </div>
                <span className="text-xs font-medium text-white/80 pr-1">
                    {participantCount}
                </span>
            </div>
        </div>
    );
};