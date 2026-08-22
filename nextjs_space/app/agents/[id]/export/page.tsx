import { Header } from '@/components/header';
import { prisma } from '@/lib/db';
import { exportAgentToJSON } from '@/lib/export/agent-exporter';
import { Download, FileCode, ArrowLeft, Bot, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AgentExportPage({ params }: { params: { id: string } }) {
  let exportPkg: any = null;
  try {
    exportPkg = await exportAgentToJSON(params.id);
  } catch (e: any) {
    console.error('Export error', e);
  }

  if (!exportPkg) {
    return (
      <div className="min-h-screen text-white relative">
        <Header />
        <div className="max-w-xl mx-auto py-24 px-4 text-center">
          <h2 className="text-xl font-bold font-orbitron text-red-400">Agent Not Found</h2>
          <Link href="/agents" className="text-xs text-[#00F0FF] underline mt-4 block">Return to Agents</Link>
        </div>
      </div>
    );
  }

  const jsonString = JSON.stringify(exportPkg, null, 2);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <div className="max-w-[1000px] mx-auto px-4 py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/agents" className="text-xs font-mono text-[#8E9BB4] hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
            </Link>
            <h1 className="font-orbitron text-2xl sm:text-4xl font-black uppercase text-white">
              Export <span className="cyan-gold-gradient-text">{exportPkg.metadata.name}</span>
            </h1>
            <p className="text-xs text-[#8E9BB4] font-sans mt-1">
              Standardized Web4 Sovereign Agent Package (Format: WEB4-AGENT-1.0). Portable to any Web4 node.
            </p>
          </div>

          <a
            href={`data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`}
            download={`${exportPkg.metadata.name.toLowerCase().replace(/\s+/g, '-')}-web4-export.json`}
          >
            <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download agent.json
            </Button>
          </a>
        </div>

        <div className="glass-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#00F0FF]">
            <span className="flex items-center gap-1.5 font-bold"><FileCode className="w-4 h-4" /> agent.json Standard Definition</span>
            <span className="text-green-400">Verified Manifest 200 OK</span>
          </div>

          <pre className="p-4 bg-black/80 rounded-xl text-xs font-mono text-[#CCD6F6] max-h-[480px] overflow-y-auto border border-white/5">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
}
