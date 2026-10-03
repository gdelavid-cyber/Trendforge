import crypto from 'crypto';
import { encryptSecret } from '@/lib/core/encryption';

/**
 * Web4 Autonomous Wallet & x402 Protocol Implementation
 * Generates real cryptographic Ed25519 (Solana Base58) and secp256k1/EVM keypairs
 * with AES-256-GCM encrypted private key material (fixes Weakness #11).
 */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58(buffer: Buffer): string {
  if (buffer.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leadingZeros = '';
  for (let k = 0; k < buffer.length && buffer[k] === 0; k++) {
    leadingZeros += BASE58_ALPHABET[0];
  }
  let encoded = '';
  for (let q = digits.length - 1; q >= 0; q--) {
    encoded += BASE58_ALPHABET[digits[q]];
  }
  return leadingZeros + encoded;
}

export interface AutonomousWallet {
  address: string;
  publicKey: string;
  encryptedPrivateKey?: string;
  chain: 'SOLANA' | 'BASE' | 'ETHEREUM';
  currency: 'USDC' | 'SOL' | 'TREND';
  balance: number;
}

// Backwards-compatibility alias
export type ConwayWallet = AutonomousWallet;

export function generateAutonomousWallet(
  agentId: string,
  chain: 'SOLANA' | 'BASE' | 'ETHEREUM' = 'SOLANA'
): AutonomousWallet {
  if (chain === 'SOLANA') {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const spkiDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
    // Last 32 bytes of Ed25519 SPKI DER are the raw 32-byte Solana public key
    const rawPubKey = spkiDer.subarray(spkiDer.length - 32);
    const pkcs8Der = privateKey.export({ type: 'pkcs8', format: 'der' }) as Buffer;

    const solAddress = encodeBase58(rawPubKey);
    return {
      address: solAddress,
      publicKey: rawPubKey.toString('hex'),
      encryptedPrivateKey: encryptSecret(pkcs8Der.toString('hex')),
      chain: 'SOLANA',
      currency: 'USDC',
      balance: 0.0, // Real funds only — agents start dormant ($0.00) until an operator explicitly deposits funds
    };
  }

  // EVM (BASE / ETHEREUM) — real secp256k1 keypair + 20-byte address
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.generateKeys();
  const uncompressedPub = ecdh.getPublicKey().subarray(1); // 64-byte X||Y
  const pubHash = crypto.createHash('sha256').update(uncompressedPub).digest('hex');
  const evmAddress = '0x' + pubHash.slice(-40);

  return {
    address: evmAddress,
    publicKey: '0x' + ecdh.getPublicKey('hex'),
    encryptedPrivateKey: encryptSecret(ecdh.getPrivateKey('hex')),
    chain,
    currency: 'USDC',
    balance: 0.0,
  };
}

// Backwards-compatibility alias
export const generateConwayWallet = generateAutonomousWallet;

/**
 * Generates an x402 Payment Required response or payload
 */
export function generateX402PaymentHeader(
  targetEndpoint: string,
  costUsdc: number,
  recipientWallet: string
) {
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
