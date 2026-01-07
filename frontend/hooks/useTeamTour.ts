import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useTeamTour = () => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        driverObj.current = driver({
            showProgress: true,
            steps: [
                {
                    element: "#analytics-growth-chart",
                    popover: {
                        title: "Growth Trends",
                        description: "Track your team's member and project growth over the last 6 months.",
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: "#analytics-role-distribution",
                    popover: {
                        title: "Role Distribution",
                        description: "See the breakdown of roles (Owners, Admins, Members) within your team.",
                        side: "right",
                        align: 'start'
                    }
                },
                {
                    element: "#analytics-monthly-pulse",
                    popover: {
                        title: "Monthly Pulse",
                        description: "Quick summary of new activities (members joined, projects created) in the current month.",
                        side: "top",
                        align: 'start'
                    }
                },
                {
                    element: "#analytics-activity-log",
                    popover: {
                        title: "Activity Log",
                        description: "A chronological timeline of important team events like new members joining or projects being created.",
                        side: "left",
                        align: 'start'
                    }
                }
            ]
        });

        // Check if user has seen the team tour
        const hasSeenTour = localStorage.getItem('hasSeenTeamTour');
        if (!hasSeenTour) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                driverObj.current.drive();
                localStorage.setItem('hasSeenTeamTour', 'true');
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
