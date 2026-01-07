import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useDashboardTour = () => {
    const driverObj = useRef<any>(null);

    const stepsMap: Record<string, any[]> = {
        backlogs: [
            {
                element: "#tab-backlogs",
                popover: { title: "Backlog Management", description: "This is your central hub for all project tasks. Here you can plan, prioritize, and assign work before moving it to active development.", side: "bottom" }
            },
            {
                element: "#backlog-filter-bar",
                popover: { title: "Powerful Filtering & AI", description: "Use the filter bar to quickly find tasks by assignee, priority, or status. You can also leverage our AI to suggest relevant tasks for your project or create new Sprints directly from here.", side: "bottom" }
            },
            {
                element: "#backlog-drop-area",
                popover: { title: "Task Organization", description: "This list contains all your unassigned Backlog tasks. Simply drag and drop tasks from here into an active Sprint to start working on them. You can also reorder them to prioritize.", side: "top" }
            }
        ],
        summary: [
            {
                element: "#tab-summary",
                popover: { title: "Project Health Overview", description: "Get a comprehensive snapshot of your project's current status and performance metrics.", side: "bottom" }
            },
            {
                element: "#summary-stats-grid",
                popover: { title: "Key Metrics", description: "Track essential KPIs including completed tasks, pending workload, and overdue items to identify bottlenecks early.", side: "bottom" }
            },
            {
                element: "#summary-charts-row",
                popover: { title: "Visual Analysis", description: "Analyze task distribution and activity trends over time using these interactive charts.", side: "top" }
            }
        ],
        boards: [
            {
                element: "#tab-boards",
                popover: { title: "Interactive Kanban Board", description: "Visualize your workflow stages and manage task progress in real-time.", side: "bottom" }
            },
            {
                element: "#kanban-board",
                popover: { title: "Drag-and-Drop Workflow", description: "Tasks are organized by columns representing their status (e.g., To Do, In Progress, Done). Drag cards between columns to update their status instantly. Click on a card to view and edit details.", side: "top" }
            },
            {
                element: "#kanban-sprint-selection",
                popover: { title: "Sprint Context", description: "If you don't have an active sprint, you can select one here to view its board.", side: "right" }
            },
            {
                element: "#kanban-add-list-btn",
                popover: { title: "Customize Columns", description: "Need more stages in your workflow? Click here to add a new column (e.g., 'In QA' or 'Review').", side: "left" }
            }
        ],
        timeline: [
            {
                element: "#tab-timeline",
                popover: { title: "Gantt Chart Timeline", description: "Visualize task schedules, dependencies, and project roadmap over time. Use this view to ensure your project delivery stays on schedule.", side: "bottom" }
            },
            {
                element: "#gantt-view-switcher",
                popover: { title: "View Controls", description: "Switch between different time scales (Day, Week, Month) to adjust your planning granularity. You can also filter tasks and toggle the task list visibility.", side: "bottom" }
            },
            {
                element: "#gantt-chart-view",
                popover: { title: "Gantt Chart Area", description: "Interact with the timeline directly. Drag bars to reschedule tasks or extend them to change their duration. Changes here are automatically synced.", side: "top" }
            }
        ]
    };

    useEffect(() => {
        driverObj.current = driver({
            showProgress: true,
            steps: [] // Steps will be set dynamically
        });
    }, []);

    const startTour = (activeTab: string = 'backlogs') => {
        if (!driverObj.current) return;

        const steps = stepsMap[activeTab] || stepsMap['backlogs'];

        driverObj.current.setConfig({
            steps: steps
        });

        driverObj.current.drive();
    };

    return { startTour };
};
