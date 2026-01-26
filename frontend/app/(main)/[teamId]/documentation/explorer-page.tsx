"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  Search,
  MoreHorizontal,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- TYPES MÔ PHỎNG ---
// Trong thực tế, bạn sẽ lấy cái này từ DB
type FileSystemItem = {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  children?: FileSystemItem[]; // Cấu trúc lồng nhau
  size?: string;
  updatedAt?: string;
};

// Dữ liệu giả lập cấu trúc cây
const MOCK_FILE_SYSTEM: FileSystemItem[] = [
  {
    id: "root-1",
    name: "Project Titan",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        parentId: "root-1",
        children: [
          {
            id: "comp",
            name: "components",
            type: "folder",
            parentId: "src",
            children: [],
          },
          {
            id: "app",
            name: "app.tsx",
            type: "file",
            parentId: "src",
            size: "2KB",
          },
        ],
      },
      {
        id: "public",
        name: "public",
        type: "folder",
        parentId: "root-1",
        children: [],
      },
      {
        id: "readme",
        name: "README.md",
        type: "file",
        parentId: "root-1",
        size: "1KB",
      },
    ],
  },
  {
    id: "root-2",
    name: "Design System",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "assets",
        name: "Assets",
        type: "folder",
        parentId: "root-2",
        children: [],
      },
    ],
  },
];

// --- COMPONENT: TREE ITEM (ĐỆ QUY) ---
interface TreeItemProps {
  item: FileSystemItem;
  level?: number;
  selectedId: string | null;
  onSelect: (item: FileSystemItem) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}

const TreeItem = ({
  item,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  toggleExpand,
}: TreeItemProps) => {
  const isExpanded = expandedIds.has(item.id);
  const isSelected = selectedId === item.id;
  const hasChildren =
    item.type === "folder" && item.children && item.children.length > 0;

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === "folder") {
      toggleExpand(item.id);
    }
  };

  const handleLabelClick = () => {
    onSelect(item);
    // Tự động mở folder nếu click vào tên (tùy chọn)
    if (item.type === "folder" && !isExpanded) {
      toggleExpand(item.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 pr-2 text-sm select-none cursor-pointer transition-colors rounded-r-md mr-2",
          isSelected
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }} // Thụt đầu dòng theo level
        onClick={handleLabelClick}
      >
        {/* Mũi tên Expand/Collapse */}
        <div
          onClick={handleIconClick}
          className={cn(
            "mr-1 p-0.5 rounded-sm hover:bg-zinc-200 dark:hover:bg-zinc-700",
            item.type !== "folder" && "opacity-0",
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Icon Folder/File */}
        <div className="mr-2 text-yellow-500 dark:text-yellow-600">
          {item.type === "folder" ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            <FileIcon className="h-4 w-4 text-zinc-400" />
          )}
        </div>

        <span className="truncate">{item.name}</span>
      </div>

      {/* Render con đệ quy nếu đang mở */}
      {isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function ExplorerPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["root-1"]),
  ); // Mặc định mở root
  const [currentFolderData, setCurrentFolderData] =
    useState<FileSystemItem | null>(null);

  // Logic: Flatten Tree để tìm item dễ hơn (hoặc dùng API call khi select)
  // Ở đây demo nên tôi dùng hàm tìm kiếm đệ quy đơn giản
  const findItem = (
    items: FileSystemItem[],
    id: string,
  ): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleSelect = (item: FileSystemItem) => {
    setSelectedFolderId(item.id);
    if (item.type === "folder") {
      setCurrentFolderData(item);
    } else {
      // Nếu chọn file, có thể mở preview hoặc vẫn giữ view ở folder cha
      // Ở đây giả sử click file thì view bên phải hiện thông tin file
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  // Lấy danh sách item để hiển thị bên phải (Content View)
  const rightPaneItems = useMemo(() => {
    if (!selectedFolderId) return MOCK_FILE_SYSTEM; // Mặc định hiện root
    return currentFolderData?.children || [];
  }, [selectedFolderId, currentFolderData]);

  return (
    <div className="h-[calc(100vh-60px)] w-full border-t bg-background">
      <ResizablePanelGroup direction="horizontal">
        {/* --- LEFT PANE: TREE VIEW --- */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={40}
          className="bg-zinc-50/50 dark:bg-zinc-900/30"
        >
          <div className="flex flex-col h-full">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-500">
                Explorer
              </span>
              <MoreHorizontal className="h-4 w-4 text-zinc-400" />
            </div>
            <ScrollArea className="flex-1 py-2">
              {/* Render Root Items */}
              {MOCK_FILE_SYSTEM.map((root) => (
                <TreeItem
                  key={root.id}
                  item={root}
                  selectedId={selectedFolderId}
                  onSelect={handleSelect}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* --- RIGHT PANE: CONTENT VIEW --- */}
        <ResizablePanel defaultSize={80}>
          <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            {/* Header / Breadcrumb / Toolbar */}
            <div className="h-14 border-b flex items-center px-4 justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-md flex-1 max-w-2xl">
                <Home className="h-4 w-4 mb-0.5" />
                <span className="text-zinc-400">/</span>
                <span className="font-medium">
                  {currentFolderData?.name || "Home"}
                </span>
              </div>
              <div className="w-64">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search in folder..."
                    className="pl-9 h-8 bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* File List Grid/Table */}
            <div className="flex-1 p-4 overflow-y-auto">
              {rightPaneItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                  <FolderOpen className="h-12 w-12 mb-3 opacity-20" />
                  <p>This folder is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Folder Item render trong Main View */}
                  {rightPaneItems.map((item) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => handleSelect(item)} // Double click để vào folder
                      className={cn(
                        "group flex flex-col items-center p-4 rounded-xl cursor-pointer border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all",
                        selectedFolderId === item.id &&
                          "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800",
                      )}
                    >
                      <div className="mb-3 transform transition-transform group-hover:scale-110">
                        {item.type === "folder" ? (
                          <Folder className="h-12 w-12 fill-yellow-400 text-yellow-600 dark:fill-yellow-500/20 dark:text-yellow-500" />
                        ) : (
                          <div className="relative">
                            <FileIcon className="h-10 w-10 text-zinc-400 fill-zinc-100 dark:fill-zinc-800" />
                            {/* Giả lập extension badge */}
                            <span className="absolute -bottom-1 -right-1 bg-zinc-200 dark:bg-zinc-700 text-[9px] font-bold px-1 rounded text-zinc-600 dark:text-zinc-300">
                              TXT
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-center font-medium text-zinc-700 dark:text-zinc-300 w-full truncate px-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-1">
                        {item.type === "file"
                          ? item.size
                          : `${item.children?.length || 0} items`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
