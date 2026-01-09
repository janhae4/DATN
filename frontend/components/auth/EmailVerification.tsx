import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { verifyEmail } from "@/services/authService";

function EmailVerification() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setError("No verification token provided");
        return;
      }

      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        console.error("Email verification failed:", err);
        setStatus("error");
        setError("The verification link is invalid or has expired.");
      }
    };

    verifyToken();
  }, [token]);

  if (status === "verifying") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Verifying Your Email
          </CardTitle>
          <CardDescription>
            Please wait while we verify your email address...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4 text-green-500">
            <CheckCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You can now log in to
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => router.push("/auth/login")}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4 text-destructive">
          <AlertCircle className="h-12 w-12" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Verification Failed
        </CardTitle>
        <CardDescription className="text-destructive">
          {error || "An error occurred during verification."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Please request a new verification link if needed.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Home
          </Button>
          <Button onClick={() => router.push("/auth/login")}>
            Go to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmailVerificationPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
            </CardHeader>
          </Card>
        }
      >
        <EmailVerification />
      </Suspense>
    </div>
  );
}
