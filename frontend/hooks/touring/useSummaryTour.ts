"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";

export const useSummaryTour = () => {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: "#project-header",
                    popover: {
                        title: "Project Overview",
                        description: "This is the name and description of your project. You can edit it here.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#stats-grid",
                    popover: {
                        title: "Key Metrics",
                        description: "Quickly view your task status, including completed, pending, overdue, and due soon tasks.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#completion-chart",
                    popover: {
                        title: "Task Completion",
                        description: "Analyze the distribution of tasks across different lists and their completion status.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#activity-chart",
                    popover: {
                        title: "Task Activity",
                        description: "Track task activity over time to understand your team's progress.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#epic-list",
                    popover: {
                        title: "Epics & Goals",
                        description: "Manage large-scale goals and epics linked to your project.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#email-box",
                    popover: {
                        title: "Communication",
                        description: "Access project-related emails and communications directly from the summary page.",
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
