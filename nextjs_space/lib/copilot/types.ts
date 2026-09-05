export type CopilotMode = 'manual' | 'co_pilot' | 'auto_close';

export type CopilotChannel =
  | 'email'
  | 'phone'
  | 'reddit'
  | 'in_app'
  | 'sms'
  | 'linkedin'
  | 'upwork'
  | 'x';

export type CopilotSessionStatus =
  | 'waiting'
  | 'engaged'
  | 'in_progress'
  | 'closed_won'
  | 'closed_lost'
  | 'escalated'
  | 'opted_out';

export interface CopilotAnalysis {
  intent: string;
  objection: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | 'hostile';
  urgency: 'low' | 'medium' | 'high';
  keyPoints: string[];
  coachingTip: string;
  suggestedReply: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'buyer' | 'user' | 'ai';
  content: string;
  channel: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface BroadcastEvent {
  type:
    | 'COPILOT_ALERT'
    | 'SUGGESTION_READY'
    | 'CALL_STATUS_CHANGE'
    | 'CALL_TRANSCRIPT_CHUNK'
    | 'DEAL_WON'
    | 'SESSION_UPDATED';
  sessionId: string;
  userId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
