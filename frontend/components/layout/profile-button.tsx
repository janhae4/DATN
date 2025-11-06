"use client";

import {
  LifeBuoy,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatarUrl: "https://placehold.co/40x40/EFEFEF/333?text=JD", 
}


  // A helper function for simple navigation to make the code cleaner.
  const navigateTo = (path: string) => {
    window.location.href = path;
  }
    // This function is kept for actions that might need more logic, like calling an API.
  const handleLogoutClick = () => {
    console.log("Đang đăng xuất...");
    // In a real app, you would call an API to invalidate the user's session here.
    // After that, redirect the user.
    window.location.href = "/login"; // Simulate navigation to the login page.
  }


export function ProfileButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
                 <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
                 <AvatarFallback>
                    {mockUser.name.charAt(0).toUpperCase()}
                 </AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{mockUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {mockUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

      <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => navigateTo('/profile')}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigateTo('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigateTo('/support')}>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" onClick={handleLogoutClick} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}