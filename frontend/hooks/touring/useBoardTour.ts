"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useBoardTour = () => {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: "#kanban-board",
                    popover: {
                        title: "Kanban Board",
                        description: "Visualize your workflow. Move tasks through different stages to track progress.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#backlog-filter-bar",
                    popover: {
                        title: "Filters & Actions",
                        description: "Use filters to find specific tasks or use actions to create tasks.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#kanban-sprint-selection",
                    popover: {
                        title: "Sprint Selection",
                        description: "Select which sprint to view on the board. Only tasks in the selected sprint are shown.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#kanban-columns-container",
                    popover: {
                        title: "Columns (Lists)",
                        description: "Each column represents a stage in your workflow (e.g., To Do, In Progress, Done).",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#kanban-add-list-btn",
                    popover: {
                        title: "Add New List",
                        description: "Create custom columns to tailor the board to your team's specific workflow.",
                        side: "left",
                        align: "start"
                    }
                }
            ]
        });

        driverObj.drive();
    };

    return { startTour };
};
