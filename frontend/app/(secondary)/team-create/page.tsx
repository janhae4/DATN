"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { teamService } from "@/services/teamService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, Plus, X, Mail } from "lucide-react";
import { toast } from "sonner";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleAddMember = (e?: React.FormEvent) => {
    e?.preventDefault();
    const email = memberInput.trim();
    
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        toast.error("Invalid email address");
        return;
    }

    if (members.includes(email)) {
        toast.error("Email already added");
        return;
    }

    setMembers([...members, email]);
    setMemberInput("");
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMembers(members.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!user) {
        toast.error("User not found. Please login again.");
        return;
    }

    setIsLoading(true);
    try {
      const newTeam = await teamService.createTeam({
        name: name,
        memberIds: [],
      });

      toast.success("Team created successfully!");
      router.push(`/${newTeam.id}`);
      console.log("Created team:", newTeam);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create your first team</CardTitle>
          <CardDescription>
            Give your team a name and invite your colleagues to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-6">
            
            {/* Team Name Input */}
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="e.g. Acme Corp, Design Team..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {/* Invite Members Section */}
            <div className="space-y-3">
                <Label>Invite Members (Optional)</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                            placeholder="colleague@example.com" 
                            className="pl-9 h-11"
                            value={memberInput}
                            onChange={(e) => setMemberInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                    </div>
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => handleAddMember()}
                        disabled={isLoading || !memberInput.trim()}
                        className="h-11"
                    >
                        Add
                    </Button>
                </div>

                {/* Danh sách thành viên đã thêm (Chips) */}
                {members.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/30 rounded-lg border border-dashed">
                        {members.map((email) => (
                            <div key={email} className="flex items-center gap-1 bg-background border px-3 py-1 rounded-full text-sm shadow-sm animate-in fade-in zoom-in-95">
                                <span className="text-muted-foreground text-xs">Member:</span>
                                <span className="font-medium">{email}</span>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveMember(email)}
                                    className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <Button type="submit" className="w-full h-11 font-medium text-base mt-2" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Team...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Create & Continue
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}