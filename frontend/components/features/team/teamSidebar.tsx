"use client";

<<<<<<< HEAD
// import * as React from "react";
// import {
//   Search,
//   Hash,
//   ChevronDown,
//   ChevronRight,
//   Users,
//   Plus,
//   Contact,
//   Settings,
// } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";

// interface SidebarSectionProps {
//   title: string;
//   children: React.ReactNode;
//   defaultOpen?: boolean;
//   action?: React.ReactNode;
// }

// function SidebarSection({
//   title,
//   children,
//   defaultOpen = true,
//   action,
// }: SidebarSectionProps) {
//   const [isOpen, setIsOpen] = React.useState(defaultOpen);

//   return (
//     <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
//       <div className="flex items-center justify-between px-4 py-1 group">
//         <CollapsibleTrigger asChild>
//           <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer uppercase tracking-wider flex-1">
//             {isOpen ? (
//               <ChevronDown className="h-3 w-3" />
//             ) : (
//               <ChevronRight className="h-3 w-3" />
//             )}
//             {title}
//           </div>
//         </CollapsibleTrigger>
//         {action && (
//           <div className="opacity-0 group-hover:opacity-100 transition-opacity">
//             {action}
//           </div>
//         )}
//       </div>
//       <CollapsibleContent>
//         <div className="space-y-[2px] px-2 mt-1">{children}</div>
//       </CollapsibleContent>
//     </Collapsible>
//   );
// }

// interface ChannelItemProps {
//   name: string;
//   isActive?: boolean;
//   hasNotification?: boolean;
// }

// function ChannelItem({ name, isActive, hasNotification }: ChannelItemProps) {
//   return (
//     <div
//       className={cn(
//         "flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group",
//         isActive
//           ? "bg-accent text-accent-foreground font-medium"
//           : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
//       )}
//     >
//       <div className="flex items-center gap-2 truncate">
//         <Hash className="h-4 w-4 opacity-50 shrink-0" />
//         <span className="truncate">{name}</span>
//       </div>
//       {hasNotification && (
//         <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
//       )}
//     </div>
//   );
// }

// interface DMItemProps {
//   name: string;
//   avatar?: string;
//   isActive?: boolean;
//   unreadCount?: number;
//   isOnline?: boolean;
//   status?: string;
// }

// function DMItem({
//   name,
//   avatar,
//   isActive,
//   unreadCount,
//   isOnline,
//   status,
// }: DMItemProps) {
//   return (
//     <div
//       className={cn(
//         "flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group",
//         isActive
//           ? "bg-accent text-accent-foreground font-medium"
//           : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
//       )}
//     >
//       <div className="flex items-center gap-3 truncate">
//         <div className="relative shrink-0">
//           <Avatar className="h-6 w-6 border border-background">
//             <AvatarImage src={avatar} />
//             <AvatarFallback className="text-[10px]">
//               {name.substring(0, 2).toUpperCase()}
//             </AvatarFallback>
//           </Avatar>
//           {isOnline && (
//             <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
//           )}
//         </div>
//         <div className="flex flex-col truncate">
//           <span className="truncate leading-none">{name}</span>
//           {status && (
//             <span className="text-[10px] text-muted-foreground truncate mt-0.5">
//               {status}
//             </span>
//           )}
//         </div>
//       </div>
//       {unreadCount && unreadCount > 0 && (
//         <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold shrink-0">
//           {unreadCount}
//         </span>
//       )}
//     </div>
//   );
// }

// import { CreateTeamModal } from "./createTeamModal";
// import { useTeams, useDiscussions, useTeamMembers, useGetOrCreateDirectMessage } from "@/hooks/useTeam";
// import { useUserProfile } from "@/hooks/useAuth";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface TeamSidebarProps {
//   onNavigate?: (view: 'teams' | 'members') => void;
//   selectedTeamId: string | null;
//   onSelectTeam: (id: string | null) => void;
// }

// export default function TeamSidebar({ 
//   onNavigate, 
//   selectedTeamId, 
//   onSelectTeam,
// }: TeamSidebarProps) {
//   const { data: teams } = useTeams();

//   // Auto-select first team if none selected
//   React.useEffect(() => {
//     if (!selectedTeamId && teams && teams.length > 0) {
//       onSelectTeam(teams[0].id);
//     }
//   }, [teams, selectedTeamId, onSelectTeam]);

//   return (
//     <div className="flex flex-col h-full bg-background! backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r">
//       {/* Header */}
//       <div className="p-4 pb-2">
//         <div className="flex justify-between items-center mb-4 px-1">
//           <h2 className="text-lg font-bold tracking-tight">Team Management</h2>
//           <div className="flex gap-1">
//             <Button variant="ghost" size="icon" className="h-8 w-8">
//               <Settings className="h-4 w-4" />
//             </Button>
//             <CreateTeamModal>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <Plus className="h-4 w-4" />
//               </Button>
//             </CreateTeamModal>
//           </div>
//         </div>
        
//         {/* Team Selector */}
//         <div className="mb-4 px-1">
//           <Select value={selectedTeamId || ""} onValueChange={onSelectTeam}>
//             <SelectTrigger className="w-full">
//               <SelectValue placeholder="Select a team" />
//             </SelectTrigger>
//             <SelectContent>
//               {teams?.map((team) => (
//                 <SelectItem key={team.id} value={team.id}>
//                   {team.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>
//       {/* Main Nav */}
//       <div className="px-3 py-2 space-y-1">
//         <div 
//           className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
//           onClick={() => onNavigate?.('teams')}
//         >
//           <Users className="h-4 w-4" />
//           <span>All Teams</span>
//         </div>
//         <div 
//           className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
//           onClick={() => onNavigate?.('members')}
//         >
//           <Contact className="h-4 w-4" />
//           <span>All Members</span>
//         </div>
//       </div>
//     </div>
//   );
// }
=======
import * as React from "react";
import {
  Search,
  Hash,
  ChevronDown,
  ChevronRight,
  Users,
  Plus,
  Contact,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}

function SidebarSection({
  title,
  children,
  defaultOpen = true,
  action,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <div className="flex items-center justify-between px-4 py-1 group">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer uppercase tracking-wider flex-1">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {title}
          </div>
        </CollapsibleTrigger>
        {action && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </div>
        )}
      </div>
      <CollapsibleContent>
        <div className="space-y-[2px] px-2 mt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ChannelItemProps {
  name: string;
  isActive?: boolean;
  hasNotification?: boolean;
}

function ChannelItem({ name, isActive, hasNotification }: ChannelItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2 truncate">
        <Hash className="h-4 w-4 opacity-50 shrink-0" />
        <span className="truncate">{name}</span>
      </div>
      {hasNotification && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
      )}
    </div>
  );
}

interface DMItemProps {
  name: string;
  avatar?: string;
  isActive?: boolean;
  unreadCount?: number;
  isOnline?: boolean;
  status?: string;
}

function DMItem({
  name,
  avatar,
  isActive,
  unreadCount,
  isOnline,
  status,
}: DMItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3 truncate">
        <div className="relative shrink-0">
          <Avatar className="h-6 w-6 border border-background">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-[10px]">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex flex-col truncate">
          <span className="truncate leading-none">{name}</span>
          {status && (
            <span className="text-[10px] text-muted-foreground truncate mt-0.5">
              {status}
            </span>
          )}
        </div>
      </div>
      {unreadCount && unreadCount > 0 && (
        <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold shrink-0">
          {unreadCount}
        </span>
      )}
    </div>
  );
}

import { CreateTeamModal } from "./createTeamModal";
import { useTeams, useDiscussions, useTeamMembers, useGetOrCreateDirectMessage } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamSidebarProps {
  onNavigate?: (view: 'teams' | 'members') => void;
  selectedTeamId: string | null;
  onSelectTeam: (id: string | null) => void;
}

export default function TeamSidebar({ 
  onNavigate, 
  selectedTeamId, 
  onSelectTeam,
}: TeamSidebarProps) {
  const { data: teams } = useTeams();

  // Auto-select first team if none selected
  React.useEffect(() => {
    if (!selectedTeamId && teams && teams.length > 0) {
      onSelectTeam(teams[0].id);
    }
  }, [teams, selectedTeamId, onSelectTeam]);

  return (
    <div className="flex flex-col h-full bg-background! backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold tracking-tight">Team Management</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
            <CreateTeamModal>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </CreateTeamModal>
          </div>
        </div>
        
        {/* Team Selector */}
        <div className="mb-4 px-1">
          <Select value={selectedTeamId || ""} onValueChange={onSelectTeam}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Main Nav */}
      <div className="px-3 py-2 space-y-1">
        <div 
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          onClick={() => onNavigate?.('teams')}
        >
          <Users className="h-4 w-4" />
          <span>All Teams</span>
        </div>
        <div 
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          onClick={() => onNavigate?.('members')}
        >
          <Contact className="h-4 w-4" />
          <span>All Members</span>
        </div>
      </div>
    </div>
  );
}
>>>>>>> origin/blank_branch
