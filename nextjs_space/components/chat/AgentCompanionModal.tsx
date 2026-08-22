'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChatInterface } from '@/components/chat/ChatInterface';

export interface AgentCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: any;
  user?: any;
  initialMessage?: string;
}

export function AgentCompanionModal({
  isOpen,
  onClose,
  agent,
  user,
  initialMessage,
}: AgentCompanionModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] max-h-[800px] p-0 bg-transparent border-0 overflow-hidden shadow-2xl">
        <DialogTitle className="sr-only">
          {agent?.name ? `Talk to ${agent.name}` : 'Visual AI Companion'}
        </DialogTitle>
        <ChatInterface
          agent={agent}
          user={user}
          initialMessage={initialMessage}
          onClose={onClose}
          standalone={false}
        />
      </DialogContent>
    </Dialog>
  );
}
