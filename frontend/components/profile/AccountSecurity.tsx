"use client"

import * as React from "react"
import {
    Lock,
    Trash2,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Provider } from '@/types/common/enums'
import { useAuth } from '@/contexts/AuthContext';

export function AccountSecurity() {
    const { user } = useAuth();
    const handleResetPassword = () => {
        console.log("Reset password requested.")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security & Account Actions
                </CardTitle>
                <CardDescription>
                    Manage password and critical account actions like deletion.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Password/Login Method */}
                <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <div>
                        <p className="font-medium">Authentication Method</p>
                        <p className="text-sm text-muted-foreground">
                            {user?.provider === Provider.LOCAL ? "Local Password" : "Google SSO"}
                        </p>
                    </div>
                    {user?.provider === Provider.LOCAL ? (
                        <Button variant="outline" size="sm" onClick={handleResetPassword}>
                            Change Password
                        </Button>
                    ) : (
                        <p className="text-sm text-green-600 font-medium">Synced</p>
                    )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors ">
                    <div>
                        <p className="font-medium ">Account Deletion</p>
                        <p className="text-sm ">
                            Warning: This action is permanent and cannot be undone.
                        </p>
                    </div>
                    <Button variant="outline" className="cursor-pointer" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
