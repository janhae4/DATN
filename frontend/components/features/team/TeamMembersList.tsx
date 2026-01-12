"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpCircle,
  Crown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Member, MemberStatus, TeamMember } from "@/types/social";
import { MemberRole } from "@/types/common/enums";
import { AddMemberDialog } from "./AddMemberDialog";
import {
  useChangeMemberRole,
  useRemoveMember,
  useTeam,
  useTeamMembers,
  useTransferOwnership,
} from "@/hooks/useTeam";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface TeamMembersListProps {
  members: Member[];
  isLoading?: boolean;
  teamId: string;
}

export function TeamMembersList({
  members,
  isLoading,
  teamId,
}: TeamMembersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { mutate: removeMember } = useRemoveMember();
  const { mutate: changeMemberRole } = useChangeMemberRole();
  const { mutate: transferOwnership } = useTransferOwnership();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const currentUserRole = useMemo(() => {
    if (!members) return null;
    const me = members.find(
      (m) => m.id === currentUserId || m.id === currentUserId
    );
    return me?.role || null;
  }, [members, currentUserId]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      const name = m?.name?.toLowerCase() || "";
      const email = m?.email?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  }, [members, searchTerm]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name;

  const handleRemove = (memberId: string) => {
    removeMember(
      { teamId: teamId, memberIds: [memberId] },
      {
        onSuccess: () =>
          toast.success(`${memberName(memberId)} has been removed`),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Failed"),
      }
    );
  };

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
<<<<<<< HEAD
    console.log(`User selected: ${newRole} for member: ${memberId}`);

    if (newRole === MemberRole.OWNER) {
      transferOwnership(
        { teamId, newOwnerId: memberId },
        {
          onSuccess: () =>
            toast.success(`Transferring ownership to ${memberName(memberId)}`),
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || "Failed"),
        }
      );
    } else {
      changeMemberRole(
        { teamId, targetId: memberId, newRole },
        {
          onSuccess: () =>
            toast.success(
              `Changing role to ${newRole} for ${memberName(memberId)}`
            ),
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || "Failed"),
        }
      );
    }

    toast.success(`Changing role to ${newRole}`);
  };

=======
    changeMemberRole(
      { teamId, targetId: memberId, newRole },
      {
        onSuccess: () =>
          toast.success(
            `Role updated to ${newRole} for ${memberName(memberId)}`
          ),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Failed"),
      }
    );
  };

  const handleTransferOwnershipRequest = (memberId: string) => {
    transferOwnership(
      { teamId, newOwnerId: memberId },
      {
        onSuccess: () =>
          toast.success(`Ownership transferred to ${memberName(memberId)}`),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Failed"),
      }
    );
  };

  const showActionsColumn = currentUserRole && currentUserRole !== MemberRole.MEMBER && members.length > 1;

>>>>>>> origin/blank_branch
  const canInvite =
    currentUserRole === MemberRole.OWNER ||
    currentUserRole === MemberRole.ADMIN;

  const canRemoveMember = (targetRole: MemberRole, targetId: string) => {
    const isSelf = members.find((m) => m.id === targetId)?.id === currentUserId;
    if (isSelf) return false;

    if (currentUserRole === MemberRole.OWNER) {
      return true;
    }
    if (currentUserRole === MemberRole.ADMIN) {
      return targetRole === MemberRole.MEMBER;
    }
    return false;
  };

  const canChangeRole = currentUserRole === MemberRole.OWNER;

  const getRoleBadge = (role: MemberRole) => {
    switch (role) {
      case MemberRole.OWNER:
        return (
          <Badge
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <ShieldAlert className="w-3 h-3 mr-1" /> Owner
          </Badge>
        );
      case MemberRole.ADMIN:
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          >
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground bg-background"
          >
            <User className="w-3 h-3 mr-1" /> Member
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case MemberStatus.ACCEPTED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Active
          </Badge>
        );
      case MemberStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"
          >
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case MemberStatus.DECLINED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 gap-1"
          >
            <XCircle className="w-3 h-3" /> Declined
          </Badge>
        );
      case MemberStatus.REMOVED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 gap-1"
          >
            <XCircle className="w-3 h-3" /> Removed
          </Badge>
        );
      case MemberStatus.BANNED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 gap-1"
          >
            <XCircle className="w-3 h-3" /> Banned
          </Badge>
        );
      case MemberStatus.LEAVED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 gap-1"
          >
            <XCircle className="w-3 h-3" /> Left
          </Badge>
        );
      default:
        return null;
    }
  };

<<<<<<< HEAD
=======

  console.log("filteredMembers: ", filteredMembers)
>>>>>>> origin/blank_branch
  return (
    <Card className="shadow-sm border-muted/60 overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 space-y-0 bg-muted/20 pb-4">
        <div className="space-y-1">
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>
            Manage and view all {members?.length || 0} members in this
            workspace.
          </CardDescription>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Add Member Button */}
          {canInvite && (
            <AddMemberDialog teamId={teamId}>
              <Button size="sm" className="h-9 shadow-sm w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </AddMemberDialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/10">
              <TableHead className="w-[40%] pl-6">Member</TableHead>
              <TableHead className="w-[20%]">Role</TableHead>
              <TableHead className="w-[20%] hidden md:table-cell">
                Joined Date
              </TableHead>
<<<<<<< HEAD
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[10%] text-right pr-6">Actions</TableHead>
=======
              {showActionsColumn && (
                <TableHead className="w-[10%] text-right pr-6">Actions</TableHead>
              )}
>>>>>>> origin/blank_branch
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // --- SKELETON LOADING STATE ---
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-6 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
<<<<<<< HEAD
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
=======
                  {showActionsColumn && (
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  )}
>>>>>>> origin/blank_branch
                </TableRow>
              ))
            ) : filteredMembers.length === 0 ? (
              // --- EMPTY STATE ---
              <TableRow>
                <TableCell
<<<<<<< HEAD
                  colSpan={4}
=======
                  colSpan={showActionsColumn ? 5 : 4}
>>>>>>> origin/blank_branch
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-muted/50">
                      <User className="h-6 w-6 opacity-40" />
                    </div>
                    <p>No members found matching "{searchTerm}".</p>
                    {searchTerm && (
                      <Button
                        variant="link"
                        onClick={() => setSearchTerm("")}
                        className="text-xs h-auto p-0"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // --- ACTUAL DATA ---
              filteredMembers.map((member) => {
                const showRemove = canRemoveMember(member.role, member.id);
                const showChangeRole =
                  canChangeRole &&
                  member.id !== currentUserId &&
                  member.status === MemberStatus.ACCEPTED &&
<<<<<<< HEAD
                  [MemberRole.ADMIN, MemberRole.OWNER].includes(member.role);
=======
                  member.role !== MemberRole.OWNER;

                const showTransferOwnership =
                  currentUserRole === MemberRole.OWNER &&
                  member.id !== currentUserId &&
                  member.status === MemberStatus.ACCEPTED;
>>>>>>> origin/blank_branch

                return (
                  <TableRow
                    key={member.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border shadow-sm">
                          <AvatarImage src={member?.avatar} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {member?.name?.substring(0, 2).toUpperCase() ??
                              "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {member?.name || "Unknown User"}
                          </span>
<<<<<<< HEAD
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 opacity-70" />{" "}
                            {member?.email || "No email"}
                          </span>
=======
>>>>>>> origin/blank_branch
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        {getRoleBadge(member.role)}
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">
                      {member.joinedAt
                        ? format(new Date(member.joinedAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {member.status && getStatusBadge(member.status)}
                    </TableCell>
<<<<<<< HEAD
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">
                      {member.joinedAt
                        ? format(new Date(member.joinedAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>

                    {member.id == currentUserId ? (
                      <TableCell className="text-right pr-6 opacity-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : (
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                              Member Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <User className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Mail className="mr-2 h-4 w-4" /> Send Message
                            </DropdownMenuItem>
                            {showChangeRole && <DropdownMenuSeparator />}
                            {showChangeRole && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={member.role}
                                    onValueChange={(value) =>
                                      handleRoleChange(
                                        member.id,
                                        value as MemberRole
                                      )
                                    }
                                  >
                                    <DropdownMenuRadioItem
                                      value={MemberRole.OWNER}
                                    >
                                      <div className="flex justify-center items-center gap-2">
                                        Owner
                                        <Crown className="mr-2 h-4 w-4 text-amber-700" />
                                      </div>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                      value={MemberRole.ADMIN}
                                    >
                                      Admin
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                      value={MemberRole.MEMBER}
                                    >
                                      Member
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}

                            {(showRemove || showChangeRole) && (
                              <DropdownMenuSeparator />
                            )}

                            {showRemove && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                onClick={() => handleRemove(member.id)}
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" /> Remove
                                from Team
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
=======

                    {showActionsColumn && (
                      member.id == currentUserId ? (
                        <TableCell className="text-right pr-6 opacity-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      ) : (
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>
                                Member Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {showTransferOwnership && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleTransferOwnershipRequest(member.id)
                                  }
                                >
                                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                                  Transfer Ownership
                                </DropdownMenuItem>
                              )}

                              {showChangeRole && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    Change Role
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                      value={member.role}
                                      onValueChange={(value) =>
                                        handleRoleChange(
                                          member.id,
                                          value as MemberRole
                                        )
                                      }
                                    >
                                      <DropdownMenuRadioItem
                                        value={MemberRole.ADMIN}
                                      >
                                        Admin
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem
                                        value={MemberRole.MEMBER}
                                      >
                                        Member
                                      </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}

                              {(showRemove || showChangeRole) && (
                                <DropdownMenuSeparator />
                              )}

                              {showRemove && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                  onClick={() => handleRemove(member.id)}
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4" /> Remove
                                  from Team
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )
>>>>>>> origin/blank_branch
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
