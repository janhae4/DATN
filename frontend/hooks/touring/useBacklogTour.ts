"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useBacklogTour = () => {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: "#backlog-search",
                    popover: {
                        title: "Search & Filter",
                        description: "Quickly find tasks by name or description. Use the filters below to refine by assignee, priority, status, and more.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#ai-suggest-btn",
                    popover: {
                        title: "AI Task Suggestions",
                        description: "Let AI help you break down requirements into actionable tasks automatically.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#backlog-filters",
                    popover: {
                        title: "Advanced Filters",
                        description: "Filter your view by Assignee, Priority, Status, Epics, Labels, and Sprints.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#view-switcher",
                    popover: {
                        title: "View Options",
                        description: "Switch between a unified list view or a split view to see Backlog and Active Sprints side-by-side.",
                        side: "bottom",
                        align: "end"
                    }
                },
                {
                    element: "#sprint-list-section",
                    popover: {
                        title: "Active Sprints",
                        description: "View and manage tasks in your current active sprints. Drag and drop tasks here to assign them.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#backlog-list-section",
                    popover: {
                        title: "Product Backlog",
                        description: "Your repository of future work. Prioritize and refine tasks here before moving them to a sprint.",
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
