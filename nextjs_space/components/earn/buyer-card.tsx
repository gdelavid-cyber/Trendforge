'use client';

import React, { useState } from 'react';
import { Mail, Check, Send, AlertCircle, Edit3, DollarSign, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface BuyerProspect {
  id?: string;
  name: string;
  source: string;
  problem: string;
  budget?: string;
  score: number;
  suggestedOffer: string;
  suggestedPrice: string;
  draftPitch: string;
  status: string;
}

interface BuyerCardProps {
  buyer: BuyerProspect;
  onApproveAndSend?: (pitch: string, price: string) => void;
  onSkip?: () => void;
}

export function BuyerCard({ buyer, onApproveAndSend, onSkip }: BuyerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pitch, setPitch] = useState(buyer.draftPitch);
  const [price, setPrice] = useState(buyer.suggestedPrice);

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4 text-left font-mono hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white">{buyer.name}</span>
        </div>
        <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-bold">
          {buyer.score}% MATCH
        </span>
      </div>

      <div className="text-[10px] text-[#8E9BB4] mb-3">
        Detected via {buyer.source}
      </div>

      <div className="text-xs text-white/90 mb-2">
        <span className="text-[#8E9BB4]">Pain point: </span>{buyer.problem}
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs">
        <div>
          <span className="text-[#8E9BB4] text-[10px]">Estimated Budget: </span>
          <span className="text-[#FFD700] font-bold">{buyer.budget || 'Inquire'}</span>
        </div>
        <div>
          <span className="text-[#8E9BB4] text-[10px]">Suggested Price: </span>
          <span className="text-[#00FF66] font-bold">{price}</span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2 mb-3">
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            className="w-full text-xs bg-black/60 border border-white/20 rounded p-2 text-white font-mono focus:border-[#00F0FF] focus:outline-none"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8E9BB4]">Offer Price:</span>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-xs bg-black/60 border border-white/20 rounded px-2 py-1 text-white font-mono w-24"
            />
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-[10px] text-[#00F0FF]">
              Done Editing
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] text-[11px] text-[#8E9BB4] mb-3 leading-relaxed relative group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#00F0FF] font-bold uppercase">Personalized Pitch</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] text-[#8E9BB4] hover:text-white flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
          <p className="line-clamp-2">{pitch}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        {onSkip && (
          <Button size="sm" variant="ghost" onClick={onSkip} className="h-8 text-xs text-[#8E9BB4]">
            Skip
          </Button>
        )}
        {onApproveAndSend && (
          <Button
            size="sm"
            onClick={() => onApproveAndSend(pitch, price)}
            className="cyan-gradient text-black font-extrabold text-xs h-8 ml-auto font-mono"
          >
            <Send className="w-3 h-3 mr-1" /> Approve & Send
          </Button>
        )}
      </div>
    </div>
  );
}