/**
 * Circuit Breaker Pattern for Swarm Agents
 * Prevents continuous failures from overwhelming external APIs or draining user budgets.
 * Trips to OPEN state after 3 consecutive failures.
 */

interface CircuitState {
  failures: number;
  lastFailureTime: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const FAILURE_THRESHOLD = 3;
const COOLDOWN_PERIOD_MS = 60 * 1000; // 1 minute cooldown

// In-memory circuit breaker registry with fallback
const circuitRegistry: Map<string, CircuitState> = new Map();

export function getCircuitState(agentType: string): CircuitState {
  if (!circuitRegistry.has(agentType)) {
    circuitRegistry.set(agentType, {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED',
    });
  }
  const current = circuitRegistry.get(agentType)!;

  // Check if cooldown expired
  if (current.state === 'OPEN' && current.lastFailureTime) {
    if (Date.now() - current.lastFailureTime > COOLDOWN_PERIOD_MS) {
      current.state = 'HALF_OPEN';
    }
  }

  return current;
}

export function recordSuccess(agentType: string): void {
  const state = getCircuitState(agentType);
  state.failures = 0;
  state.lastFailureTime = null;
  state.state = 'CLOSED';
}

export function recordFailure(agentType: string): void {
  const state = getCircuitState(agentType);
  state.failures += 1;
  state.lastFailureTime = Date.now();

  if (state.failures >= FAILURE_THRESHOLD) {
    state.state = 'OPEN';
  }
}

export function canExecute(agentType: string): { allowed: boolean; reason?: string } {
  const state = getCircuitState(agentType);
  if (state.state === 'OPEN') {
    const remainingSec = Math.max(
      0,
      Math.ceil((COOLDOWN_PERIOD_MS - (Date.now() - (state.lastFailureTime || 0))) / 1000)
    );
    return {
      allowed: false,
      reason: `Circuit breaker OPEN for agent '${agentType}' after ${state.failures} consecutive failures. Cooldown active (${remainingSec}s remaining).`,
    };
  }
  return { allowed: true };
}
