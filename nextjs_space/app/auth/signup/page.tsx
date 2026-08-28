'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Flame, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if ((form.password?.length ?? 0) < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Sign up failed');

      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.ok) {
        router.replace('/dashboard');
      } else {
        toast.error('Account created but sign in failed. Please sign in manually.');
        router.replace('/auth/signin');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Flame className="w-8 h-8 text-gold" />
            <span className="font-display font-bold text-2xl gold-text">Trendly</span>
          </Link>
          <h1 className="font-display font-bold text-2xl">Start Forging Your Wealth</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a free account to access weekly tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card-bg border border-border-subtle rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10 bg-dark-navy border-border-subtle"
                placeholder="Your name"
                value={form.name}
                onChange={(e: any) => setForm({ ...form, name: e.target?.value ?? '' })}
                required
              />
            </div>
          </div>
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
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e: any) => setForm({ ...form, password: e.target?.value ?? '' })}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                className="pl-10 bg-dark-navy border-border-subtle"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e: any) => setForm({ ...form, confirmPassword: e.target?.value ?? '' })}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            By signing up, you agree that Trendly content is for educational purposes only.
          </p>
          <Button type="submit" className="w-full gold-gradient text-black font-bold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-gold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
