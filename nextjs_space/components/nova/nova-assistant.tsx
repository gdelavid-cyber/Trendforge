'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Sparkles, Zap, MessageSquare, Plus, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: 'user' | 'nova';
  text: string;
  timestamp: string;
}

export function NovaAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      sender: 'nova',
      text: "Hey there! I'm Nova, your 24/7 AI companion on Trendly. I can guide you through Video Empire Play 1, answer any question about our agents, or help you draft outreach messages. How can I help today?",
      timestamp: 'Just now',
    },
  ]);
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSchedule, setTaskSchedule] = useState('Daily at 8:00 AM UTC');
  const [customTasks, setCustomTasks] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch custom tasks
  useEffect(() => {
    if (isOpen) {
      fetch('/api/nova/tasks')
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setCustomTasks(data.tasks);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}`,
            sender: 'nova',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        if (data.warning) {
          toast.warning(data.warning);
        }
      } else {
        toast.error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      toast.error('Network error contacting Nova');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const res = await fetch('/api/nova/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, schedule: taskSchedule }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Task created: "${taskTitle}" (5 credits deducted)`);
        setCustomTasks((prev) => [data.task, ...prev]);
        setTaskTitle('');
        setActiveTab('tasks');
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch (_) {
      toast.error('Error creating task');
    }
  };

  return (
    <>
      {/* Persistent Floating Orb in Bottom-Right (60x60px) */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 rounded-full bg-[#07090e] border-2 border-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.5)] flex items-center justify-center cursor-pointer group"
          title="Nova 24/7 AI Companion (Cmd+K)"
        >
          {/* Subtle breathing glow */}
          <div className="absolute inset-0 rounded-full bg-[#38bdf8]/20 animate-ping opacity-30 pointer-events-none" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#38bdf8] to-[#00F0FF] flex items-center justify-center text-black shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          {/* Status Dot */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#00FF66] border-2 border-[#07090e] rounded-full" />
        </motion.button>
      </div>

      {/* Expanded Chat Drawer (400x600px) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[420px] h-[580px] rounded-3xl bg-[#07090e]/95 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col overflow-hidden font-sans text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <span>NOVA AI COMPANION</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 font-bold">
                      24/7 LIVE
                    </span>
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono">2 Credits / Msg · Cmd+K</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 text-xs font-mono">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-center transition-all ${
                  activeTab === 'chat' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] font-bold' : 'text-[#94a3b8]'
                }`}
              >
                Chat &amp; Intel
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 py-2 text-center transition-all ${
                  activeTab === 'tasks' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] font-bold' : 'text-[#94a3b8]'
                }`}
              >
                Custom Tasks ({customTasks.length})
              </button>
            </div>

            {/* Tab 1: Chat View */}
            {activeTab === 'chat' ? (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-[#38bdf8] text-black font-medium'
                            : 'bg-white/[0.04] text-[#f8fafc] border border-white/10'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-[#94a3b8] font-mono mt-0.5 px-1">{m.timestamp}</span>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2 text-[#38bdf8] text-[11px] font-mono p-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" /> Nova is thinking...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Prompt Suggestions */}
                <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto border-t border-white/5 bg-black/20">
                  <button
                    onClick={() => handleSendMessage('How do I start Video Empire Play 1?')}
                    className="text-[10px] font-mono whitespace-nowrap bg-white/[0.03] hover:bg-[#38bdf8]/10 text-[#94a3b8] hover:text-[#38bdf8] border border-white/10 px-2 py-1 rounded-lg transition-all"
                  >
                    Start Play 1
                  </button>
                  <button
                    onClick={() => handleSendMessage('How do AI credits work?')}
                    className="text-[10px] font-mono whitespace-nowrap bg-white/[0.03] hover:bg-[#38bdf8]/10 text-[#94a3b8] hover:text-[#38bdf8] border border-white/10 px-2 py-1 rounded-lg transition-all"
                  >
                    Credit Costs
                  </button>
                  <button
                    onClick={() => handleSendMessage('Write a cold pitch for a local dentist')}
                    className="text-[10px] font-mono whitespace-nowrap bg-white/[0.03] hover:bg-[#38bdf8]/10 text-[#94a3b8] hover:text-[#38bdf8] border border-white/10 px-2 py-1 rounded-lg transition-all"
                  >
                    Dentist Pitch
                  </button>
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask Nova anything..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#38bdf8]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || loading}
                    className="h-8 w-8 p-0 bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-black rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              /* Tab 2: Custom Tasks View */
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#38bdf8]" /> Create 24/7 Background Task
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Monitor Dental Video Trends Daily"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#38bdf8]"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#94a3b8]">Schedule: Daily 8am UTC</span>
                    <Button
                      size="sm"
                      onClick={handleCreateTask}
                      disabled={!taskTitle.trim()}
                      className="bg-[#38bdf8] text-black text-[10px] font-bold uppercase h-6 px-3"
                    >
                      Create (5 Credits)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#94a3b8] uppercase">Active Monitored Tasks:</span>
                  {customTasks.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{t.title}</span>
                        <span className="text-[9px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded font-bold">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#38bdf8]" /> {t.schedule}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}