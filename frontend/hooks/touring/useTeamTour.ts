"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useTeamTour = () => {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: "#team-header",
                    popover: {
                        title: "Team Overview",
                        description: "View basic team info, member count, and settings for your team.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#team-stats",
                    popover: {
                        title: "Key Metrics",
                        description: "Quickly track Active Projects, Team Members, and Active Tasks assigned to you.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#team-analytics",
                    popover: {
                        title: "Analytics",
                        description: "Visual insights into your team's workload and project distribution.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#recent-projects",
                    popover: {
                        title: "Recent Projects",
                        description: "Jump back into your most recently accessed projects.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#my-tasks",
                    popover: {
                        title: "My Tasks",
                        description: "See your upcoming deadlines and pending tasks across all projects.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#team-members",
                    popover: {
                        title: "Team Members",
                        description: "Manage your team roster. Add new members or update roles here.",
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
