'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSent(true);
        toast.success('If an account exists with that email, a reset link has been dispatched via SendGrid.');
      } else {
        toast.error('Failed to process request');
      }
    } catch {
      toast.error('Error submitting password reset');
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
          <h1 className="font-display font-bold text-2xl">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="bg-card-bg border border-border-subtle rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">If an account exists with that email, instructions have been sent.</p>
            <Link href="/auth/signin">
              <Button variant="outline" className="mt-4">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card-bg border border-border-subtle rounded-lg p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  className="pl-10 bg-dark-navy border-border-subtle"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: any) => setEmail(e.target?.value ?? '')}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full gold-gradient text-black font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
          </form>
        )}
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/auth/signin" className="text-gold hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
