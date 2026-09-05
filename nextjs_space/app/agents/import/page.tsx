'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { Upload, FileCode, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentImportPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      toast.error('Paste a valid agent export JSON package.');
      return;
    }

    setImporting(true);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/agents/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: parsed }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully imported ${data.agent.name}!`);
        router.push('/agents');
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (e: any) {
      toast.error(`Invalid JSON syntax: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <div className="max-w-[800px] mx-auto px-4 py-12">
        <Link href="/agents" className="text-xs font-mono text-[#8E9BB4] hover:text-white flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
        </Link>
        <h1 className="font-orbitron text-3xl font-black uppercase text-white mb-2">
          Import <span className="cyan-gold-gradient-text">Web4 Sovereign Agent</span>
        </h1>
        <p className="text-xs text-[#8E9BB4] font-sans mb-8">
          Upload or paste a standardized JSON agent package (Format: WEB4-AGENT-1.0) to deploy an existing agent onto your node.
        </p>

        <div className="glass-card p-6 border border-white/10 space-y-4">
          <label className="text-xs font-mono text-[#00F0FF] font-bold uppercase block">
            Paste agent.json Payload:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{\n  "formatVersion": "WEB4-AGENT-1.0",\n  "metadata": { "name": "Apex Miner", "archetype": "DATA_MINER" },\n  "skillsDag": [...]\n}'
            rows={12}
            className="w-full bg-black/80 border border-white/10 rounded-xl p-4 text-xs font-mono text-white focus:border-[#00F0FF] outline-none"
          />

          <Button
            onClick={handleImport}
            disabled={importing || !jsonText.trim()}
            className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
          >
            {importing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Initializing Conway Wallet & Importing...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Import & Deploy Agent
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
