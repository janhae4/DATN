"use client";

import * as React from "react";
import { BellIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// 1. Mock JSON Data
// In a real app, you would fetch this from an API.
const mockNotifications = [
  { id: 1, title: "New Message", message: "You have a new message from Jane Doe." },
  { id: 2, title: "System Update", message: "Your system will restart for an update at 2:00 AM." },
  { id: 3, title: "Friend Request", message: "John Smith sent you a friend request." },
  { id: 4, title: "Payment Received", message: "Your invoice #1234 has been paid." },
  { id: 5, title: "Password Changed", message: "Your password was successfully changed." },
  { id: 6, title: "New Login", message: "There was a new login to your account from a different device." },
  { id: 7, title: "Project Deadline", message: "Project 'Alpha' is due tomorrow." },
  { id: 8, title: "Team Mention", message: "You were mentioned in the #general channel." },
];

export function NotificationPopover() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 3;

  const totalPages = Math.ceil(mockNotifications.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = mockNotifications.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <BellIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 m-2">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {mockNotifications.length} unread messages.
            </p>
          </div>
          <Separator />
          <div className="grid gap-4">
            {/* 3. Loop through the current page's notifications */}
            {currentNotifications.length > 0 ? (
              currentNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  {/* Don't add a separator after the last item */}
                  {index < currentNotifications.length - 1 && <Separator />}
                </React.Fragment>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No new notifications.</p>
            )}
          </div>

          {/* 4. Pagination Component */}
          {totalPages > 1 && (
             <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                          e.preventDefault();
                          handlePreviousPage();
                      }}
                      // Disable if on the first page
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                   <PaginationItem>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                   </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                          e.preventDefault();
                          handleNextPage();
                      }}
                       // Disable if on the last page
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
            </Pagination>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
