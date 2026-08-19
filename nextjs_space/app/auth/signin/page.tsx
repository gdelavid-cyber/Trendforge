'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Flame, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        router.replace('/dashboard');
      } else {
        toast.error('Invalid email or password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Flame className="w-8 h-8 text-gold" />
            <span className="font-display font-bold text-2xl gold-text">TrendForge</span>
          </Link>
          <h1 className="font-display font-bold text-2xl">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to access your tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card-bg border border-border-subtle rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                className="pl-10 bg-dark-navy border-border-subtle"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e: any) => setForm({ ...form, email: e.target?.value ?? '' })}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                className="pl-10 bg-dark-navy border-border-subtle"
                placeholder="Your password"
                value={form.password}
                onChange={(e: any) => setForm({ ...form, password: e.target?.value ?? '' })}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full gold-gradient text-black font-bold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign In
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-gold hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
