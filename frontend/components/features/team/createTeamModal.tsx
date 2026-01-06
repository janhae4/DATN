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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(50, "Team name is too long"),
  members: z.array(z.string()).optional(), // IDs or Emails
});

// Mock users for demonstration
const MOCK_USERS = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "/mock-data/avatar1.jpg",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    avatar: "/mock-data/avatar2.jpg",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    avatar: "/mock-data/avatar3.jpg",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@example.com",
    avatar: "/mock-data/avatar4.jpg",
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie@example.com",
    avatar: "/mock-data/avatar5.jpg",
  },
];

interface CreateTeamModalProps {
  children: React.ReactNode;
}

type Member = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isNew?: boolean;
};

export function CreateTeamModal({ children }: CreateTeamModalProps) {
  const [open, setOpen] = React.useState(false);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedMembers, setSelectedMembers] = React.useState<Member[]>([]);
  const [searchValue, setSearchValue] = React.useState("");

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
    try {
      // Simulate API call
      // Mix of IDs (for existing users) and Emails (for new invites)
      const payload = {
        ...values,
        members: selectedMembers.map((m) => (m.isNew ? m.email : m.id)),
      };

      console.log("Creating team with payload:", payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Team created successfully!");
      setOpen(false);
      reset();
      setSelectedMembers([]);
      setSearchValue("");
    } catch (error) {
      toast.error("Failed to create team");
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

  const addEmailMember = (email: string) => {
    const newMember: Member = {
      id: email, // Use email as ID for new members
      name: email,
      email: email,
      isNew: true,
    };

    if (!selectedMembers.some((m) => m.id === newMember.id)) {
      const newSelectedMembers = [...selectedMembers, newMember];
      setSelectedMembers(newSelectedMembers);
      setValue(
        "members",
        newSelectedMembers.map((m) => m.id)
      );
    }
    setSearchValue("");
    setOpenCombobox(false);
  };

  const removeMember = (memberId: string) => {
    const newSelectedMembers = selectedMembers.filter((m) => m.id !== memberId);
    setSelectedMembers(newSelectedMembers);
    setValue(
      "members",
      newSelectedMembers.map((m) => m.id)
    );
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team and add members to collaborate.
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
                  placeholder="Acme Inc."
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
                  <PopoverContent className="w-[300px] p-0" align="start" side="right">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search members or enter email..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        {/* Filtered Users */}
                        {MOCK_USERS.filter(
                          (u) =>
                            u.name
                              .toLowerCase()
                              .includes(searchValue.toLowerCase()) ||
                            u.email
                              .toLowerCase()
                              .includes(searchValue.toLowerCase())
                        ).map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => toggleMember(user)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Checkbox
                                checked={selectedMembers.some(
                                  (m) => m.id === user.id
                                )}
                                className="mr-2 pointer-events-none"
                              />
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>
                                  {user.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}

                        {/* Add Email Option */}
                        {searchValue &&
                          isValidEmail(searchValue) &&
                          !MOCK_USERS.some((u) => u.email === searchValue) && (
                            <CommandItem
                              value={searchValue}
                              onSelect={() => addEmailMember(searchValue)}
                              className="cursor-pointer"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              <div className="flex flex-col">
                                <span>Add email invite</span>
                                <span className="text-xs text-muted-foreground">
                                  {searchValue}
                                </span>
                              </div>
                            </CommandItem>
                          )}

                        {/* Empty State */}
                        {!MOCK_USERS.some(
                          (u) =>
                            u.name
                              .toLowerCase()
                              .includes(searchValue.toLowerCase()) ||
                            u.email
                              .toLowerCase()
                              .includes(searchValue.toLowerCase())
                        ) &&
                          (!searchValue || !isValidEmail(searchValue)) && (
                            <CommandEmpty>
                              {searchValue
                                ? "No member found. Enter a valid email to invite."
                                : "No member found."}
                            </CommandEmpty>
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
                          <AvatarImage src={member.avatar} />
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
              {isSubmitting ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
