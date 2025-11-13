import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, RotateCw } from 'lucide-react';
import { verifyAccount, resendVerificationCode } from '@/services/authService';

const verificationSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type FormData = z.infer<typeof verificationSchema>;

export function AccountVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (values: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await verifyAccount(values.code);
      
      // Redirect to dashboard or show success message
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      setResendSuccess(false);
      
      await resendVerificationCode();
      setResendSuccess(true);
      setCountdown(60); // 1 minute cooldown
      
    } catch (err) {
      console.error('Failed to resend code:', err);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify Your Account</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to your email. Please enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit code" 
                      maxLength={6}
                      autoComplete="one-time-code"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            
            {resendSuccess && (
              <div className="text-sm font-medium text-green-600">
                A new verification code has been sent to your email.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Verify Account'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Didn't receive a code? 
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending || countdown > 0}
            className="ml-1 font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isResending ? (
              <RotateCw className="inline h-4 w-4 animate-spin" />
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Code'
            )}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default AccountVerification;
