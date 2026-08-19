'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, DollarSign, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function SubmitStoryPage() {
  const router = useRouter();
  const [form, setForm] = useState({ taskId: '', earningsAmount: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: form.taskId, earningsAmount: parseFloat(form.earningsAmount), description: form.description }),
      });
      if (res.ok) {
        toast.success('Story submitted for verification!');
        router.push('/stories');
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed to submit');
      }
    } catch { toast.error('Error submitting story'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-2xl mb-2 flex items-center gap-2">
            <Upload className="w-6 h-6 text-gold" /> Submit Success Story
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Share your earnings and inspire the community. Stories are verified before publishing.</p>

          <form onSubmit={handleSubmit} className="bg-card-bg border border-border-subtle rounded-lg p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Task ID</label>
              <Input className="bg-dark-navy border-border-subtle" placeholder="e.g. task-1" value={form.taskId}
                onChange={(e: any) => setForm({ ...form, taskId: e.target?.value ?? '' })} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Earnings Amount ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" className="pl-10 bg-dark-navy border-border-subtle" placeholder="1000" value={form.earningsAmount}
                  onChange={(e: any) => setForm({ ...form, earningsAmount: e.target?.value ?? '' })} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Your Story</label>
              <Textarea className="bg-dark-navy border-border-subtle min-h-[100px]" placeholder="Describe how you completed the task and earned money..."
                value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target?.value ?? '' })} required />
            </div>
            <Button type="submit" className="w-full gold-gradient text-black font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Submit for Verification
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
