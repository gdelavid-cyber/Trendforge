import { EventEmitter } from 'events';

export interface StationEvent {
  runId: string;
  type: 'token' | 'tool_call' | 'tool_result' | 'step' | 'error' | 'complete';
  timestamp: number;
  payload: any;
}

class StationEventBus extends EventEmitter {
  emitEvent(event: StationEvent) {
    this.emit(`run:${event.runId}`, event);
    this.emit('global', event);
  }

  subscribeRun(runId: string, listener: (event: StationEvent) => void) {
    this.on(`run:${runId}`, listener);
    return () => this.off(`run:${runId}`, listener);
  }

  subscribeGlobal(listener: (event: StationEvent) => void) {
    this.on('global', listener);
    return () => this.off('global', listener);
  }
}

// Global singleton instance
const globalForBus = global as unknown as { stationBus?: StationEventBus };
export const stationBus = globalForBus.stationBus || new StationEventBus();
if (process.env.NODE_ENV !== 'production') globalForBus.stationBus = stationBus;
