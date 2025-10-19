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
import { SettingsSectionProps, Provider } from '../../lib/types/profile.type'

export function AccountSecurity({ user }: SettingsSectionProps) {
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
                <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <div>
                        <p className="font-medium">Authentication Method</p>
                        <p className="text-sm text-muted-foreground">
                            {user.provider === Provider.LOCAL ? "Local Password" : "Google SSO"}
                        </p>
                    </div>
                    {user.provider === Provider.LOCAL ? (
                        <Button variant="outline" size="sm" onClick={handleResetPassword}>
                            Change Password
                        </Button>
                    ) : (
                        <p className="text-sm text-green-600 font-medium">Synced</p>
                    )}
                </div>

                <div className="flex items-center justify-between p-3 border border-destructive rounded-md bg-destructive/10">
                    <div>
                        <p className="font-medium text-destructive">Account Deletion</p>
                        <p className="text-sm text-destructive/80">
                            Warning: This action is permanent and cannot be undone.
                        </p>
                    </div>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
