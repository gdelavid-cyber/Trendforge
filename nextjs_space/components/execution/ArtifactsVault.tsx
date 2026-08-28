'use client';

import React, { useState } from 'react';
import {
  FileText,
  Video,
  Code,
  Image as ImageIcon,
  Download,
  Eye,
  CheckCircle2,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export interface ArtifactItem {
  id: string;
  taskId: string;
  name: string;
  type: string;
  storageUrl: string;
  previewUrl?: string | null;
  fileHash: string;
  fileSize?: number | null;
  metadata?: any;
  createdAt: string;
}

interface Props {
  artifacts: ArtifactItem[];
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  video: Video,
  image: ImageIcon,
  code: Code,
  document: FileText,
  data: Code,
  listing: ImageIcon,
};

export function ArtifactsVault({ artifacts }: Props) {
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-green-400 uppercase">
              DELIVERABLE VAULT // READY TO SELL
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
            Generated Assets & Products
          </h2>
        </div>

        <span className="text-xs font-mono text-white/50">
          {artifacts.length} Vaulted Asset{artifacts.length === 1 ? '' : 's'}
        </span>
      </div>

      {artifacts.length === 0 ? (
        <div className="py-12 text-center text-white/40 text-xs font-mono">
          No deliverables generated yet. Run the autonomous swarm to produce turnkey assets.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artifacts.map((a) => {
            const Icon = TYPE_ICONS[a.type] || FileText;

            return (
              <div
                key={a.id}
                className="liquid-glass-strong rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:scale-105 transition-transform group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#00F0FF]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 uppercase">
                      {a.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white truncate max-w-[200px]" title={a.name}>
                      {a.name}
                    </h3>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">
                      {a.fileSize ? `${(a.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Turnkey Package'} · Verified
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedArtifact(a)}
                    className="w-full text-xs font-mono h-8 rounded-full border-white/15 text-white/80 hover:text-white flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </Button>

                  <a
                    href={a.storageUrl}
                    download={a.name}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
                    title="Download Asset"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0D1A] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00F0FF]" />
                <span className="font-mono text-xs text-white font-bold uppercase">
                  Asset Provenance & Verification
                </span>
              </div>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="text-[10px] text-white/40">DELIVERABLE NAME</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedArtifact.name}</div>
              </div>

              <div>
                <div className="text-[10px] text-white/40">SHA-256 HASH</div>
                <div className="text-[11px] text-[#00F0FF] break-all bg-white/5 p-2 rounded-xl mt-0.5">
                  {selectedArtifact.fileHash}
                </div>
              </div>

              {selectedArtifact.metadata && (
                <div>
                  <div className="text-[10px] text-white/40 mb-1">METADATA & SPECS</div>
                  <pre className="text-[10px] text-white/70 bg-white/5 p-2.5 rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedArtifact.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedArtifact(null)}
                className="text-xs font-mono rounded-full h-9"
              >
                Close
              </Button>
              <a
                href={selectedArtifact.storageUrl}
                download={selectedArtifact.name}
                className="liquid-glass-strong px-5 py-2 rounded-full text-xs font-mono font-bold text-white hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Asset</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
