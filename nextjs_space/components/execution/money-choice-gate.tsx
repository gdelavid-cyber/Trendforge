'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, MessageSquare, DollarSign } from 'lucide-react';
import Link from 'next/link';

export function MoneyChoiceGate({ executionId, leadCount }: { executionId: string; leadCount: number }) {
  return (
    <Card className="border-emerald-500/30 bg-emerald-950/10 backdrop-blur-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Ready to close deals</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your kit is complete. The bot found {leadCount} people who already publicly asked for this. You pitch, you close, you keep 100%.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <Link href={`/dashboard/my-work/${executionId}/buyers`}>
            <Button variant="outline" className="w-full h-auto py-3 px-4 flex flex-col items-start text-left bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-white group">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-sm">See {leadCount} pre-qualified buyers</span>
              </div>
              <span className="text-[11px] font-normal text-slate-400 mt-1">
                Real people who posted the exact problem. Ranked by intent. Your kit's pitch ready to copy.
              </span>
            </Button>
          </Link>

          <Link href={`/dashboard/my-work/${executionId}/coach`}>
            <Button variant="outline" className="w-full h-auto py-3 px-4 flex flex-col items-start text-left bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-white group">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-sm">Practice the pitch first</span>
              </div>
              <span className="text-[11px] font-normal text-slate-400 mt-1">
                AI plays the buyer. Get scored. Nail objections before you talk to a real prospect.
              </span>
            </Button>
          </Link>
        </div>

        <div className="mt-3 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <p className="text-[11px] text-cyan-300 flex items-center gap-1.5 font-mono">
            <Target className="h-3.5 w-3.5 shrink-0" />
            The bot never messages anyone. You always own the conversation and the close.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
