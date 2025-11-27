import React from 'react'
import StatsCard from './statsCard'
import { UsersIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon, CalendarIcon } from 'lucide-react'
import { TaskCompletionPieChart } from '../../charts/TaskCompletionPieChart'
import { TaskActivityLineChart } from '../../charts/TaskActivityLineChart'
import { AISummaryBox } from './AISummaryBox'
import { UnreadEmailBox } from './UnreadEmailBox'
const Summary = () => {
    return (
        <div className="flex flex-1 flex-col gap-4 pt-0 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent pb-4">
            <div className="grid auto-rows-min  gap-4 md:grid-cols-4 sm:grid-cols-2">
                <StatsCard icon={<CheckCircleIcon />} value={12} title="Completed" period="Over 7 days" change={12} unit="tasks" />
                <StatsCard icon={<ClockIcon />} value={120} title="Pending Tasks" period="Over 7 days" unit="tasks" />
                <StatsCard icon={<AlertTriangleIcon />} value={12} title="Overdue Tasks" period="Over 7 days" unit="tasks" />
                <StatsCard icon={<CalendarIcon />} value={12} title="Due Soon" period="Over 7 days" unit="tasks" />
            </div>
            <div className="flex gap-4">
                <div className="bg-muted/50 aspect-video rounded-xl w-full" >
                    <TaskCompletionPieChart />
                </div>
                <div className="bg-muted/50 aspect-video rounded-xl w-full " >
                    <TaskActivityLineChart />
                </div>
            </div>
            <div className="flex gap-4">
                <div className="bg-muted/50 aspect-video rounded-xl w-full" ><AISummaryBox /></div>
                <div className="bg-muted/50 aspect-video rounded-xl w-full" ><UnreadEmailBox /></div>
            </div>
        </div>
    )
}

export default Summary