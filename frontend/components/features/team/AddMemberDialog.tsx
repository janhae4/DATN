import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddMember, useTeamMembers, useGetOrCreateDirectMessage } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AddMemberDialogProps {
  teamId: string | null;
  children?: React.ReactNode;
  onSelectDiscussion?: (id: string) => void;
}

export function AddMemberDialog({ teamId, children, onSelectDiscussion }: AddMemberDialogProps) {
  const [email, setEmail] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const addMember = useAddMember();
  const { data: members, isLoading: isLoadingMembers } = useTeamMembers(teamId);
  const { data: userProfile } = useUserProfile();
  const getOrCreateDirectMessage = useGetOrCreateDirectMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      toast.error("No team selected");
      return;
    }
    if (!email) {
      toast.error("Please enter an email");
      return;
    }

    try {
      await addMember.mutateAsync({ teamId, email });
      setOpen(false);
      setEmail("");
      toast.success("Member added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
      console.error(error);
    }
  };

  const handleMemberClick = async (targetUserId: string) => {
    if (!userProfile?.id || !onSelectDiscussion) return;

    try {
      const discussion = await getOrCreateDirectMessage.mutateAsync({
        currentUserId: userProfile.id,
        targetUserId: targetUserId,
      });

      if (discussion) {
        onSelectDiscussion(discussion.id);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to open DM", error);
      toast.error("Failed to open conversation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent">
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your team by entering their email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="user@example.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addMember.isPending}>
              {addMember.isPending ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
        </form>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Current Members</h4>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {members?.length || 0}
            </span>
          </div>
          <Separator className="mb-3" />
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
            {isLoadingMembers ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Loading members...
              </p>
            ) : members && members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  onClick={() => handleMemberClick(member.user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback>
                        {member.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                    {member.role.toLowerCase()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No members found
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
