'use client';
import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { login } from './actions';

// Based on Watermelon UI "alphine-login-form".
export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="bg-muted flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Undangan</CardTitle>
          <CardDescription>Ammar &amp; Yulia · masuk untuk mengelola tamu dan ucapan</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user">Username</Label>
              <Input id="user" name="user" autoComplete="username" defaultValue={state?.user} required autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending && <Spinner />} Masuk</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
