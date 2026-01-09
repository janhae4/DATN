"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateDiscussion, useTeamMembers } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { Member } from "@/types";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(50, "Channel name is too long"),
  members: z.array(z.string()).optional(),
});

interface CreateChannelDialogProps {
  teamId: string | null;
  children?: React.ReactNode;
}

export function CreateChannelDialog({
  teamId,
  children,
}: CreateChannelDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedMembers, setSelectedMembers] = React.useState<any[]>([]);
  const [searchValue, setSearchValue] = React.useState("");

  const { data: teamMembers } = useTeamMembers(teamId);
  const { data: userProfile } = useUserProfile();
  const createDiscussion = useCreateDiscussion();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      members: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!teamId || !userProfile?.id) return;

    try {
      await createDiscussion.mutateAsync({
        teamId,
        name: values.name,
        ownerId: userProfile.id,
        memberIds: selectedMembers.map((m) => m.id),
      });

      toast.success("Channel created successfully!");
      setOpen(false);
      reset();
      setSelectedMembers([]);
      setSearchValue("");
    } catch (error) {
      toast.error("Failed to create channel");
      console.error(error);
    }
  };

  const toggleMember = (member: Member) => {
    const isSelected = selectedMembers.some((m) => m.id === member.id);
    let newSelectedMembers;

    if (isSelected) {
      newSelectedMembers = selectedMembers.filter((m) => m.id !== member.id);
    } else {
      newSelectedMembers = [...selectedMembers, member];
    }

    setSelectedMembers(newSelectedMembers);
    setValue(
      "members",
      newSelectedMembers.map((m) => m.id)
    );
  };

  const removeMember = (memberId: string) => {
    const newSelectedMembers = selectedMembers.filter((m) => m.id !== memberId);
    setSelectedMembers(newSelectedMembers);
    setValue(
      "members",
      newSelectedMembers.map((m) => m.Id)
    );
  };

  const availableMembers =
    teamMembers?.filter((m) => m.id !== userProfile?.id && !!m.id) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new channel and add members to collaborate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  placeholder="e.g. marketing-updates"
                  {...register("name")}
                  className={
                    errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-3">Members</Label>
              <div className="col-span-3 space-y-3">
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      Select members...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[300px] p-0"
                    align="start"
                    side="right"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search members..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        {availableMembers
                          .filter(
                            (m) =>
                              m.name
                                .toLowerCase()
                                .includes(searchValue.toLowerCase()) ||
                              m.email
                                .toLowerCase()
                                .includes(searchValue.toLowerCase())
                          )
                          .map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.name}
                              onSelect={() => toggleMember(member)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Checkbox
                                  checked={selectedMembers.some(
                                    (m) => m.id === member.id
                                  )}
                                  className="mr-2 pointer-events-none"
                                />
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={member.avatar || undefined}
                                  />
                                  <AvatarFallback>
                                    {member.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span>{member.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {member.email}
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}

                        {availableMembers.length === 0 && (
                          <CommandEmpty>No members found.</CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        className="pl-1 pr-1 py-1 flex items-center gap-1"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-normal">
                          {member.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
