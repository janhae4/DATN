import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useDashboardTour = () => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        driverObj.current = driver({
            showProgress: true,
            steps: [
                {
                    element: "#dashboard-tabs-list",
                    popover: {
                        title: "Project Views",
                        description: "Navigate between different views of your project here. Switch between Backlogs, Summary, Kanban Boards, and Timeline.",
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: "#tab-backlogs",
                    popover: {
                        title: "Backlogs",
                        description: "Manage your backlog tasks efficiently. This is where you list all your upcoming work.",
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: "#tab-summary",
                    popover: {
                        title: "Project Summary",
                        description: "Get a high-level overview of your project's progress and key metrics.",
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: "#tab-boards",
                    popover: {
                        title: "Kanban Board",
                        description: "Visualize your workflow with a Kanban board. Drag and drop tasks to update their status.",
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: "#tab-timeline",
                    popover: {
                        title: "Timeline View",
                        description: "Plan your project schedule with a Gantt chart timeline view.",
                        side: "bottom",
                        align: 'start'
                    }
                }
            ]
        });

        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
        if (!hasSeenTour) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                driverObj.current.drive();
                localStorage.setItem('hasSeenDashboardTour', 'true');
            }, 1000);
        }
    }, []);

    const startTour = () => {
        if (driverObj.current) {

            driverObj.current.drive();
        }
    };

    return { startTour };
};
