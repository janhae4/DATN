"use client"

import * as React from "react"
import {
    User as UserIcon,
    Save,
    Upload,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Provider } from '@/types/common/enums'
import { useAuth } from '@/contexts/AuthContext';
import { linkGoogleAccount } from "@/services/authService"
export function ProfileHeaderAndGeneral() {
    const { user } = useAuth();
    const [name, setName] = React.useState(user?.name)
    const [phone, setPhone] = React.useState(user?.phone || "")

    const handleSave = () => {
        console.log("Saving General settings:", { name, phone })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Profile Information
                </CardTitle>
                <CardDescription>
                    Manage your display name, email, and profile picture.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="flex items-center gap-6">
                    <Avatar className="size-20 border-2 border-background shadow-md">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="text-xl">
                            {user?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Profile Picture</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4 mr-2" /> Upload
                            </Button>
                            <Button variant="ghost" size="sm">Remove</Button>
                        </div>

                        <Button onClick={linkGoogleAccount}>Link Google Account</Button>
                        {user?.provider === Provider.GOOGLE && (
                            <p className="text-xs text-muted-foreground">
                                Synced from Google
                            </p>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={user?.email}
                            disabled
                            className="bg-muted/50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Email cannot be changed
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Optional phone number"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-4 justify-end cursor-pointer">
                <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    )
}
