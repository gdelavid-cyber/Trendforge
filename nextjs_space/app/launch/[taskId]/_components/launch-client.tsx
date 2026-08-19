'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Play, CheckCircle, Copy, ExternalLink, Rocket, ArrowRight, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrendCategoryBadge } from '@/components/trend-badge';
import { toast } from 'sonner';

interface Props {
  task: { id: string; title: string; steps: any; toolLinks: any; category: string };
  userTask: { stepsCompleted: number; status: string } | null;
}

export function LaunchClient({ task, userTask }: Props) {
  const [launched, setLaunched] = useState(userTask?.status === 'IN_PROGRESS' || userTask?.status === 'COMPLETED');
  const [stepsCompleted, setStepsCompleted] = useState(userTask?.stepsCompleted ?? 0);

  const steps: string[] = (() => { try { return typeof task?.steps === 'string' ? JSON.parse(task.steps) : (task?.steps ?? []); } catch { return []; } })();
  const toolLinks: { name: string; url: string }[] = (() => { try { return typeof task?.toolLinks === 'string' ? JSON.parse(task.toolLinks) : (task?.toolLinks ?? []); } catch { return []; } })();

  const dockerCmd = `docker run -it --rm \\
  -e TASK_ID=${task?.id ?? 'unknown'} \\
  -e API_KEY=tf_******* \\
  -p 8080:8080 \\
  trendly/launcher:latest`;

  const codespacesUrl = `https://github.com/codespaces/new?machine=basicLinux32gb&repo=trendly&ref=main`;

  const handleLaunch = async () => {
    try {
      const res = await fetch(`/api/tasks/${task?.id}/launch`, { method: 'POST' });
      if (res.ok) { setLaunched(true); toast.success('Task launched!'); }
    } catch { toast.error('Failed to launch'); }
  };

  const handleStepComplete = async (idx: number) => {
    try {
      const res = await fetch(`/api/tasks/${task?.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepsCompleted: idx + 1 }),
      });
      if (res.ok) { setStepsCompleted(idx + 1); }
    } catch {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText?.(text)?.then?.(() => toast.success('Copied!')).catch?.(() => {});
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-6 h-6 text-gold" />
          <h1 className="font-display font-bold text-2xl">Execution Environment</h1>
        </div>
        <div className="flex items-center gap-2 mb-8">
          <TrendCategoryBadge category={task?.category ?? 'OTHER'} />
          <span className="text-muted-foreground">{task?.title ?? 'Task'}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card-bg border border-border-subtle rounded-lg p-5 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" /> Steps ({stepsCompleted}/{steps?.length ?? 0})
              </h3>
              <div className="space-y-2">
                {(steps ?? []).map((step: string, i: number) => (
                  <button key={i} onClick={() => launched && handleStepComplete(i)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-2 ${
                      i < stepsCompleted ? 'bg-green-500/10 text-green-400' : 'bg-dark-navy/50 text-muted-foreground hover:bg-dark-navy'
                    }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                      i < stepsCompleted ? 'bg-green-500 text-white' : 'border border-border-subtle'
                    }`}>
                      {i < stepsCompleted ? '✓' : i + 1}
                    </span>
                    <span className={i < stepsCompleted ? 'line-through' : ''}>{step}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main area */}
          <div className="lg:col-span-2 space-y-6">
            {!launched ? (
              <div className="bg-card-bg border border-gold/20 rounded-lg p-8 text-center">
                <Rocket className="w-12 h-12 text-gold mx-auto mb-4" />
                <h2 className="font-display font-bold text-xl mb-2">Ready to Launch</h2>
                <p className="text-muted-foreground mb-6">Start this task to track your progress and access the execution tools.</p>
                <Button className="gold-gradient text-black font-bold text-lg px-8 h-12" onClick={handleLaunch}>
                  <Play className="w-5 h-5 mr-2" /> Launch Task
                </Button>
              </div>
            ) : (
              <>
                {/* Docker command */}
                <div className="bg-[#0D1117] border border-border-subtle rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-[#161B22]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-muted-foreground">Docker Launch Command</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(dockerCmd)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto">
                    <code>{dockerCmd}</code>
                  </pre>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href={codespacesUrl} target="_blank" rel="noopener noreferrer">
                    <div className="bg-card-bg border border-border-subtle rounded-lg p-5 hover:border-gold/20 transition-all cursor-pointer">
                      <Monitor className="w-6 h-6 text-blue-400 mb-2" />
                      <h3 className="font-semibold text-sm mb-1">GitHub Codespaces</h3>
                      <p className="text-xs text-muted-foreground">Open a pre-configured cloud IDE with all tools ready.</p>
                      <span className="text-xs text-gold flex items-center gap-1 mt-2">
                        Open <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                  {(toolLinks ?? []).map((tool: any) => (
                    <a key={tool?.url} href={tool?.url} target="_blank" rel="noopener noreferrer">
                      <div className="bg-card-bg border border-border-subtle rounded-lg p-5 hover:border-gold/20 transition-all cursor-pointer">
                        <ExternalLink className="w-6 h-6 text-gold mb-2" />
                        <h3 className="font-semibold text-sm mb-1">{tool?.name ?? 'Tool'}</h3>
                        <p className="text-xs text-muted-foreground">Open {tool?.name} in a new tab</p>
                      </div>
                    </a>
                  ))}
                </div>

                {/* API Key Info */}
                <div className="bg-card-bg border border-border-subtle rounded-lg p-5">
                  <h3 className="font-semibold text-sm mb-2">API Key Injection</h3>
                  <p className="text-xs text-muted-foreground mb-3">Your API keys are automatically injected into the execution environment. They are masked for security.</p>
                  <div className="bg-[#0D1117] rounded p-3 font-mono text-xs">
                    <div className="text-muted-foreground">TRENDLY_API_KEY=tf_****...****</div>
                    <div className="text-muted-foreground">TASK_ID={task?.id ?? 'unknown'}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
