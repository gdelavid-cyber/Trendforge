import type { BroadcastEvent } from './types';

type EventListener = (event: BroadcastEvent) => void;

// In-process event emitter registry for active user sessions
class CopilotEventHub {
  private listeners: Map<string, Set<EventListener>> = new Map();

  subscribe(userId: string, listener: EventListener): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(listener);

    return () => {
      const userListeners = this.listeners.get(userId);
      if (userListeners) {
        userListeners.delete(listener);
        if (userListeners.size === 0) {
          this.listeners.delete(userId);
        }
      }
    };
  }

  broadcast(event: BroadcastEvent) {
    const userListeners = this.listeners.get(event.userId);
    if (userListeners) {
      userListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error('[CopilotEventHub] Error in event listener:', err);
        }
      });
    }

    // If external Supabase or Pusher is configured, optionally forward here
  }
}

export const copilotEventHub = new CopilotEventHub();

export function broadcastCopilotEvent(event: BroadcastEvent) {
  copilotEventHub.broadcast(event);
}
