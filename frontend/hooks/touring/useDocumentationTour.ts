"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useDocumentationTour = () => {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: "#doc-header",
                    popover: {
                        title: "Documentation Hub",
                        description: "Manage all your project files and assets in one place.",
                        side: "bottom",
                        align: "start"
                    }
                },
                {
                    element: "#upload-toggle-btn",
                    popover: {
                        title: "Upload Files",
                        description: "Click here to open the upload area where you can drag & drop or select files.",
                        side: "bottom",
                        align: "end"
                    }
                },
                {
                    element: "#filter-bar",
                    popover: {
                        title: "Filter & Search",
                        description: "Quickly find files by name, project context, or file type.",
                        side: "top",
                        align: "start"
                    }
                },
                {
                    element: "#view-toggle",
                    popover: {
                        title: "View Options",
                        description: "Switch between Grid view for visuals or Table view for detailed lists.",
                        side: "top",
                        align: "end"
                    }
                },
                {
                    element: "#doc-content",
                    popover: {
                        title: "File Content",
                        description: "Preview, download, or manage your files here.",
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
