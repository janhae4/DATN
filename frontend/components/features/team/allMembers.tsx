"use client";

import { db } from "@/public/mock-data/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AllMembers() {
  const users = db.users;

  return (
    <div className="flex-1 h-full p-6 overflow-y-auto bg-background">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Members</h2>
          <p className="text-muted-foreground text-sm">
            Directory of all team members
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {users.map((user) => (
          <Card
            key={user.id}
            className="overflow-hidden hover:shadow-lg transition-all duration-200 border-muted/60 w- cursor-pointer group"
          >
            <CardHeader className="p-0! border-b max-h-20">
              <div className=" w-full overflow-hidden">
                <Avatar className="h-full w-full rounded-none">                                               
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.name} 
                    className="object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                  <AvatarFallback className="rounded-none text-2xl bg-muted">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 text-center ">
              <h3 className="font-semibold truncate">
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
