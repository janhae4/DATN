"use client";

import * as React from "react";
// Thêm icon X cho nút Decline
import { BellIcon, CheckIcon, TrashIcon, X } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications"; // Hook của bạn
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTeams } from "@/hooks/useTeam";

// Import hoặc define Type nếu cần thiết để TS không báo lỗi
// import { NotificationType } from "@/types";

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    refetch,
  } = useNotifications();

  const { acceptInvite, declineInvite } = useTeams();

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleAction = async (
    notification: any,
    actionType: "ACCEPT" | "DECLINE"
  ) => {
    const { metadata, id } = notification;
    console.log("Metadata:", metadata);
    if (!metadata || !metadata.action) {
      toast.error("Invalid notification data");
      return;
    }

    try {
      switch (metadata.action) {
        case "MEMBER_INVITED":
        case "ADD_MEMBER_TARGET":
        case "MEMBER_ADDED":
          if (actionType === "ACCEPT") {
            await acceptInvite({
              teamId: metadata.teamId,
              notificationId: id,
            });
            await toast.success("Joined team successfully");
          } else {
            await declineInvite({
              teamId: metadata.teamId,
              notificationId: id,
            });
            toast.info("Declined invitation");
          }
          break;
        default:
          console.warn("Unknown action:", metadata.action);
          return;
      }
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Action failed");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 m-2 p-0" align="end">
        <div className="grid gap-0">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div className="space-y-1">
              <h4 className="font-medium leading-none">Notifications</h4>
              <p className="text-xs text-muted-foreground">
                You have {unreadCount} unread messages.
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 text-xs"
                onClick={() => markAllAsRead()}
              >
                Mark all as read
              </Button>
            )}
          </div>
          <Separator />

          <ScrollArea className="h-[300px]">
            <div className="grid gap-2 p-1">
              {currentNotifications.length > 0 ? (
                currentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex flex-col gap-1 p-3 rounded-xl transition-colors hover:bg-muted/50 ${!notification.isRead ? "bg-muted/100" : ""
                      }`}
                  >
                    {/* Header: Title + Actions (Read/Delete) */}
                    <div className="flex items-start justify-between gap-2">
                      <h5
                        className={`text-sm leading-none ${!notification.isRead ? "font-semibold" : "font-medium"
                          }`}
                      >
                        {notification.title}
                      </h5>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Mark as read"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <span className="sr-only">Mark as read</span>
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>

                    {notification.type === "PENDING" && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notification, "ACCEPT");
                          }}
                        >
                          <CheckIcon className="mr-1 h-3 w-3" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notification, "DECLINE");
                          }}
                        >
                          <X className="mr-1 h-3 w-3" /> Decline
                        </Button>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(new Date(notification.createdAt).getTime() + 7 * 60 * 60 * 1000), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <BellIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-2 border-t bg-muted/30">
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePreviousPage();
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-xs text-muted-foreground px-2">
                      {currentPage} / {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNextPage();
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
