import { describe, expect, it } from 'vitest';
import { encryptSecret, decryptSecret, maskSecret } from '../lib/encryption';
import { getCircuitState, recordFailure, recordSuccess, canExecute } from '../lib/agents/circuit-breaker';
import { detectAnomalies } from '../lib/brain/anomaly';

describe('AI Brain & Security Unit Tests', () => {
  describe('Encryption Utility (AES-256-GCM)', () => {
    it('should encrypt and decrypt secrets cleanly with zero data loss', () => {
      const plaintext = 'sk_live_super_secret_trading_token_999';
      const encrypted = encryptSecret(plaintext);

      expect(encrypted).not.toEqual(plaintext);
      expect(encrypted.split(':').length).toBe(3); // IV:AuthTag:Ciphertext

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toEqual(plaintext);
    });

    it('should mask secrets for safe logging', () => {
      const token = 'polymarket_secret_99887766';
      const masked = maskSecret(token);
      expect(masked).toBe('poly...7766');
      expect(masked).not.toContain('secret');
    });
  });

  describe('Agent Circuit Breaker', () => {
    const testAgent = 'test_agent_breaker';

    it('should trip to OPEN after 3 consecutive failures', () => {
      expect(canExecute(testAgent).allowed).toBe(true);

      recordFailure(testAgent);
      recordFailure(testAgent);
      expect(canExecute(testAgent).allowed).toBe(true);

      recordFailure(testAgent);
      const check = canExecute(testAgent);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Circuit breaker OPEN');

      // Recover
      recordSuccess(testAgent);
      expect(canExecute(testAgent).allowed).toBe(true);
    });
  });

  describe('Anomaly Detection Engine', () => {
    it('should detect budget overrun anomaly when LLM monthly cost exceeds $200', async () => {
      const mockMetrics = {
        timestamp: new Date().toISOString(),
        totalUsers: 50,
        activeUsers7d: 30,
        totalTasksCompleted: 120,
        totalRevenueUsd: 950,
        totalAgentRuns: 80,
        agentSuccessRate: 98.5,
        estimatedLlmCostMonth: 215.50, // Exceeds $200
        systemErrorRatePercent: 1.5,
      };

      const anomalies = await detectAnomalies(mockMetrics);
      const budgetAnomaly = anomalies.find((a) => a.id === 'anomaly_llm_cost_budget');
      expect(budgetAnomaly).toBeDefined();
      expect(budgetAnomaly?.severity).toBe('CRITICAL');
    });
  });
});
