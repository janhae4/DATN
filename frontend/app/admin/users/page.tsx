"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { UserProfile } from "@/types/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  UserPlus, 
  Settings,
  X,
  Check,
  User as UserIcon,
  Mail,
  Shield,
  Zap,
  Github,
  Globe,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // New user form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    jobTitle: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminService.deleteUser(userId);
      toast.success("User deleted successfully");
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this linked account? The user might lose access if this is their only login method.")) return;
    try {
      await adminService.deleteAccount(accountId);
      toast.success("Account unlinked successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createUser(formData);
      toast.success("User created successfully");
      setIsAddModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "USER", jobTitle: "" });
      fetchUsers();
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await adminService.updateUser(editingUser.id, formData);
      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleSkillToggle = async (user: UserProfile, skillName: string) => {
    const currentSkills = user.skills?.map(s => s.skillName) || [];
    let newSkills: string[];
    
    if (currentSkills.includes(skillName)) {
      newSkills = currentSkills.filter(s => s !== skillName);
    } else {
      newSkills = [...currentSkills, skillName];
    }

    try {
      await adminService.updateUserSkills(user.id, newSkills);
      fetchUsers();
      toast.success("Skills updated");
    } catch (error) {
      toast.error("Failed to update skills");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getProviderIcon = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'GOOGLE':
        return <Globe className="h-3 w-3 text-red-400" />;
      case 'GITHUB':
        return <Github className="h-3 w-3 text-white" />;
      case 'LOCAL':
        return <Key className="h-3 w-3 text-amber-400" />;
      default:
        return <Shield className="h-3 w-3 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 p-8 font-sans selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-500 mb-2">
              User Management
            </h1>
            <p className="text-zinc-400">Manage accounts, roles and specialization skills</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
              <Input 
                placeholder="Search users..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full md:w-[300px] bg-white/5 border-white/10 focus:border-white/20 focus:ring-0 rounded-xl transition-all"
              />
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-zinc-200 rounded-xl px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#161618] border-white/10 text-white rounded-2xl max-w-md shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Create New Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Full Name</label>
                    <Input 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Email Address</label>
                    <Input 
                      required 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl" 
                      placeholder="john@example.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Initial Password</label>
                    <Input 
                      required 
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl" 
                      placeholder="••••••••" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Job Title</label>
                      <Input 
                        value={formData.jobTitle}
                        onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                        className="bg-white/5 border-white/10 rounded-xl" 
                        placeholder="Developer" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Role</label>
                      <select 
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-white/5 border-white/10 rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                      >
                        <option value="USER" className="bg-[#161618]">User</option>
                        <option value="ADMIN" className="bg-[#161618]">Admin</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-bold mt-4">
                    Create Account
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section>
          <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-white/2">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium py-4">Identity</TableHead>
                  <TableHead className="text-zinc-400 font-medium py-4">Linked Accounts</TableHead>
                  <TableHead className="text-zinc-400 font-medium py-4">Specialization</TableHead>
                  <TableHead className="text-zinc-400 font-medium py-4 text-right">Settings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredUsers.map((user, idx) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-white/5 group hover:bg-white/2 transition-colors"
                    >
                      <TableCell className="py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{user.name}</span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-2">
                           <div className="flex flex-wrap gap-2">
                             {user.accounts && user.accounts.length > 0 ? (
                               user.accounts.map((acc: any) => (
                                 <Badge 
                                   key={acc.id} 
                                   variant="secondary"
                                   className="bg-white/5 hover:bg-white/10 text-[10px] flex items-center gap-1.5 py-1 px-2 border-none group/acc"
                                 >
                                   {getProviderIcon(acc.provider)}
                                   <span className="opacity-70">{acc.provider}</span>
                                   <button 
                                      onClick={() => handleDeleteAccount(acc.id)}
                                      className="ml-1 opacity-0 group-hover/acc:opacity-100 transition-opacity hover:text-red-400 p-0.5"
                                      title="Unlink account"
                                   >
                                     <X className="h-2.5 w-2.5" />
                                   </button>
                                 </Badge>
                               ))
                             ) : (
                               <span className="text-[10px] text-zinc-600">No accounts</span>
                             )}
                           </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] font-bold ${user.role === 'ADMIN' ? 'border-amber-500/50 text-amber-500 bg-amber-500/5' : 'border-indigo-500/50 text-indigo-500 bg-indigo-500/5'}`}>
                              {user.role}
                            </Badge>
                            <span className="text-[11px] text-zinc-500 truncate max-w-[100px]">{user.jobTitle || 'No Title'}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {user.skills && user.skills.length > 0 ? (
                              user.skills.slice(0, 3).map((s: any) => (
                                <Badge 
                                  key={s.id || s.skillName} 
                                  className="bg-white/5 hover:bg-white/10 text-zinc-400 border-none rounded-md px-1.5 py-0 text-[9px] group/skill relative"
                                >
                                  {s.skillName}
                                  <button 
                                    onClick={() => handleSkillToggle(user, s.skillName)}
                                    className="ml-1 opacity-0 group-hover/skill:opacity-100 transition-opacity hover:text-red-400"
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </Badge>
                              ))
                            ) : null}
                            {user.skills && user.skills.length > 3 && (
                              <span className="text-[9px] text-zinc-600">+{user.skills.length - 3} more</span>
                            )}
                            <button 
                              className="h-4 w-4 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                              onClick={() => {
                                const skill = prompt("Enter new skill name:");
                                if (skill) handleSkillToggle(user, skill);
                              }}
                            >
                              <Plus className="h-2.5 w-2.5 text-zinc-500" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-zinc-500">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg group/config">
                            <Settings className="h-4 w-4 group-hover/config:rotate-45 transition-transform" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(user.id)}
                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredUsers.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <UserIcon className="h-12 w-12 text-zinc-800" />
                        <p className="text-zinc-500 text-lg">No users found matching your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Integration Stats / Footer */}
        <footer className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Accounts" value={users.length} icon={<UserIcon />} trend="+2 this week" />
          <StatCard title="Security Level" value="Advanced" icon={<Shield />} trend="All systems normal" />
          <StatCard title="Sync status" value="Real-time" icon={<Zap />} trend="Last sync: Just now" />
        </footer>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: any, trend: string }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg text-zinc-400">
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">{title}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-zinc-500">{trend}</div>
    </div>
  );
}
