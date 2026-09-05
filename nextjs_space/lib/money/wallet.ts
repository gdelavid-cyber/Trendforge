import crypto from 'crypto';

/**
 * Web4 Autonomous Wallet & x402 Protocol Implementation
 * Provides sovereign crypto wallet generation (USDC/SOL/TREND) and HTTP 402 micro-payment proxy.
 */

export interface AutonomousWallet {
  address: string;
  publicKey: string;
  chain: 'SOLANA' | 'BASE' | 'ETHEREUM';
  currency: 'USDC' | 'SOL' | 'TREND';
  balance: number;
}

// Backwards-compatibility alias
export type ConwayWallet = AutonomousWallet;

export function generateAutonomousWallet(agentId: string, chain: 'SOLANA' | 'BASE' = 'SOLANA'): AutonomousWallet {
  const seed = crypto.createHash('sha256').update(`autonomous-wallet-${agentId}-${Date.now()}`).digest('hex');
  
  // Deterministic address generation
  const address = chain === 'SOLANA' 
    ? 'Sol' + seed.substring(0, 38)
    : '0x' + seed.substring(0, 40);

  return {
    address,
    publicKey: 'pk_' + seed.substring(0, 32),
    chain,
    currency: 'USDC',
    balance: 0.0, // Real funds only — agents start dormant ($0.00) until an operator explicitly deposits funds
  };
}

// Backwards-compatibility alias
export const generateConwayWallet = generateAutonomousWallet;

/**
 * Generates an x402 Payment Required response or payload
 */
export function generateX402PaymentHeader(targetEndpoint: string, costUsdc: number, recipientWallet: string) {
  const paymentToken = 'x402_' + crypto.randomBytes(16).toString('hex');

  return {
    status: 402,
    headers: {
      'X-402-Payment-Required': 'true',
      'X-402-Token': paymentToken,
      'X-402-Price-USDC': costUsdc.toFixed(4),
      'X-402-Recipient': recipientWallet,
      'X-402-Gateway': 'https://trendly-platform-chi.vercel.app/api/web4/x402/verify',
    },
    payload: {
      error: 'Payment Required',
      message: `Execution of ${targetEndpoint} requires ${costUsdc} USDC.`,
      paymentToken,
      costUsdc,
      recipientWallet,
    },
  };
}
