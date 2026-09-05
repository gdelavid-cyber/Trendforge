'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Clock,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CallDashboardProps {
  sessionId: string;
  lead?: any;
  onClose: () => void;
}

export function CallDashboard({ sessionId, lead, onClose }: CallDashboardProps) {
  const [callStatus, setCallStatus] = useState<'ringing' | 'live' | 'completed'>('ringing');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [whisperSuggestion, setWhisperSuggestion] = useState<string>(
    'Confirm their primary concern regarding emergency call latency before presenting price terms.'
  );

  const [liveTranscript, setLiveTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([
    {
      speaker: 'system',
      text: 'Call connected. Two-party consent disclosure played.',
      time: '00:01',
    },
    {
      speaker: 'buyer',
      text: 'Hello? Yeah, this is Mike. We got your message about the emergency dispatch setup.',
      time: '00:04',
    },
    {
      speaker: 'user',
      text: 'Hi Mike, thanks for taking my call! Wanted to quickly see if your night dispatch is still going to voicemail.',
      time: '00:08',
    },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const callLiveTimer = setTimeout(() => {
      setCallStatus('live');
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(callLiveTimer);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async (outcome: 'DEAL_WON' | 'ESCALATED' | 'COMPLETED') => {
    setCallStatus('completed');
    if (outcome === 'DEAL_WON') {
      try {
        await fetch('/api/webhooks/stripe/co-pilot-close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, amount: 450 }),
        });
        toast.success('Call ended: Deal Confirmed and Marked WON!');
      } catch (_) {
        toast.success('Call completed.');
      }
    } else {
      toast.info(`Call completed: Status set to ${outcome}.`);
    }
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl rounded-2xl bg-[#07070C] border border-white/20 p-6 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                callStatus === 'live'
                  ? 'bg-[#00FF66]/20 text-[#00FF66] animate-pulse'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              <PhoneCall className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-sans">
                  Calling: {lead?.buyerName || 'Mike Vance (Prospect)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white">
                  {callStatus}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8E9BB4]">
                <Clock className="w-3.5 h-3.5" /> {formatTime(callDuration)}
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-1 text-[#00FF66] text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Two-Party Consent Verified
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8E9BB4] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio & Transcript Stream */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8E9BB4]">
            <span className="flex items-center gap-1.5 font-bold uppercase">
              <Volume2 className="w-4 h-4 text-[#00F0FF]" /> Deepgram Real-time Audio Stream
            </span>
            <span className="text-[10px] text-white/40">Sub-second Latency</span>
          </div>

          <div className="h-48 overflow-y-auto p-4 rounded-xl bg-[#0B0B14] border border-white/10 space-y-3 text-xs scrollbar-thin">
            {liveTranscript.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-[10px] text-white/40 mt-0.5 font-bold">{t.time}</span>
                <span
                  className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    t.speaker === 'buyer'
                      ? 'bg-blue-500/20 text-blue-300'
                      : t.speaker === 'user'
                      ? 'bg-[#00FF66]/20 text-[#00FF66]'
                      : 'bg-white/10 text-[#8E9BB4]'
                  }`}
                >
                  {t.speaker}
                </span>
                <span className="text-white/90 leading-relaxed">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time AI Whisper Card */}
        <div className="p-4 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#00F0FF] uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Real-Time AI Whisper (Sales Co-Pilot)
            </span>
            <span className="text-[10px] text-[#00F0FF]/80">Listening to buyer objection...</span>
          </div>
          <p className="text-xs text-white leading-relaxed font-sans">{whisperSuggestion}</p>
        </div>

        {/* Call Controls & Conclusion Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMuted(!muted)}
              variant="outline"
              size="sm"
              className={`border-white/20 text-xs ${muted ? 'bg-red-500/20 text-red-400' : 'text-white'}`}
            >
              {muted ? <MicOff className="w-3.5 h-3.5 mr-1" /> : <Mic className="w-3.5 h-3.5 mr-1" />}
              {muted ? 'Muted' : 'Mute'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleEndCall('ESCALATED')}
              variant="outline"
              size="sm"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs font-bold uppercase"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Escalate
            </Button>

            <Button
              onClick={() => handleEndCall('DEAL_WON')}
              size="sm"
              className="bg-[#00FF66] text-black hover:bg-[#00FF66]/90 text-xs font-extrabold uppercase px-4"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirm Deal ($450)
            </Button>

            <Button
              onClick={() => handleEndCall('COMPLETED')}
              size="sm"
              variant="destructive"
              className="text-xs font-bold uppercase px-4"
            >
              <PhoneOff className="w-3.5 h-3.5 mr-1" /> End Call
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
