"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useGanttTour = () => {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: "#gantt-view-switcher",
                    popover: {
                        title: "View Controls",
                        description: "Customize your Gantt chart view. Change time scales (Day, Week, Month) to fit your planning needs.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#gantt-filter-input",
                    popover: {
                        title: "Filter Tasks",
                        description: "Quickly find specific tasks in the timeline by name.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#gantt-list-toggle",
                    popover: {
                        title: "Toggle List",
                        description: "Show or hide the task list sidebar to maximize timeline space.",
                        side: "bottom",
                        align: "end"
                    }
                },
                {
                    element: "#gantt-chart-container",
                    popover: {
                        title: "Gantt Timeline",
                        description: "Visualize dependencies and schedules. Drag tasks to reschedule or extend their duration.",
                        side: "top",
                        align: "start"
                    }
                }
            ]
        });

        driverObj.drive();
    };

    return { startTour };
};
