import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';
import { postEntry } from './ledger';

// On-chain USDC deposit verification (Solana). The platform treasury is a
// single env-owned wallet; users fund agents by sending USDC with an 8-char
// memo = the agent's referenceCode. The cron verifier scans treasury
// signatures since the last cursor, parses amount + memo, matches the agent,
// and credits the ledger idempotently — one Deposit row + one DEPOSIT entry
// per transaction signature. Unknown memos are rejected, never guessed.

export const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Crockford-style alphabet: no 0/O/1/I — codes stay readable when read aloud.
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateReferenceCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return code;
}

/** Lazily assigns a unique reference code to legacy agents; returns the code. */
export async function ensureReferenceCode(agentId: string): Promise<string> {
  const agent = await prisma.web4Agent.findUniqueOrThrow({
    where: { id: agentId },
    select: { referenceCode: true },
  });
  if (agent.referenceCode) return agent.referenceCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferenceCode();
    try {
      await prisma.web4Agent.update({ where: { id: agentId }, data: { referenceCode: code } });
      return code;
    } catch {
      // unique collision — regenerate
    }
  }
  throw new Error('Could not allocate a unique reference code');
}

// --- Solana JSON-RPC (fetch-based, no SDK dependency) ---

function rpcUrl(): string {
  return process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC ${method} ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`Solana RPC ${method}: ${JSON.stringify(body.error)}`);
  return body.result as T;
}

interface SignatureInfo {
  signature: string;
  err: unknown;
  blockTime?: number;
}

export interface ParsedDepositTx {
  amountUsdc: number;
  memo: string | null;
}

/**
 * Extracts the USDC amount received by the treasury and the transaction memo
 * from a jsonParsed transaction. Handles both SPL Memo v1/v2 forms:
 * parsed instructions carry `parsed.memo`; raw v1 instructions keep the text
 * in `data`. Amount comes from pre/post token balance deltas on the
 * treasury's USDC token account — robust across transfer instruction variants.
 */
export function parseDepositTx(tx: any, opts: { treasury: string; usdcMint?: string }): ParsedDepositTx | null {
  if (!tx?.meta) return null;
  const usdcMint = opts.usdcMint ?? USDC_MINT_MAINNET;

  // Memo: any Memo-program instruction in the outer list or inner group.
  const MEMO_PROGRAMS = new Set([
    'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', // SPL Memo v2
    'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo', // SPL Memo v1
  ]);
  let memo: string | null = null;
  const scanForMemo = (ixs: any[]) => {
    for (const ix of ixs ?? []) {
      const programId = typeof ix.programId === 'string' ? ix.programId : ix.programId?.toBase58?.();
      if (!programId || !MEMO_PROGRAMS.has(programId)) continue;
      const candidate =
        typeof ix.parsed?.memo === 'string'
          ? ix.parsed.memo
          : typeof ix.data === 'string' && /^[\x20-\x7E]{1,64}$/.test(ix.data)
            ? ix.data
            : null;
      if (candidate && !memo) memo = candidate.trim().toUpperCase();
    }
  };
  scanForMemo(tx.transaction?.message?.instructions);
  for (const inner of tx.meta.innerInstructions ?? []) scanForMemo(inner.instructions);

  // USDC delta on the treasury's token account(s).
  const pre = tx.meta.preTokenBalances ?? [];
  const post = tx.meta.postTokenBalances ?? [];
  let amountUsdc = 0;
  for (const after of post) {
    const mint = after.mint;
    const owner = typeof after.owner === 'string' ? after.owner : after.owner?.toBase58?.();
    if (mint !== usdcMint || owner !== opts.treasury) continue;
    const before = pre.find((b: any) => b.accountIndex === after.accountIndex);
    const delta = (after.uiTokenAmount?.uiAmount ?? 0) - (before?.uiTokenAmount?.uiAmount ?? 0);
    if (delta > 0) amountUsdc += delta;
  }

  if (amountUsdc <= 0 && !memo) return null;
  return { amountUsdc: Math.round(amountUsdc * 1e6) / 1e6, memo };
}

// --- Verifier ---

export interface VerifyResult {
  skipped?: boolean;
  reason?: string;
  scanned: number;
  credited: number;
  rejected: number;
  cursor: string | null;
}

/**
 * Scans treasury signatures newer than the stored cursor and credits matched
 * deposits. Idempotent at two layers: Deposit.txSignature is unique, and the
 * ledger entry key [agentId, DEPOSIT, ref=signature] rejects replays.
 */
export async function verifyDeposits(opts: { limit?: number } = {}): Promise<VerifyResult> {
  const treasury = process.env.SOLANA_TREASURY_ADDRESS;
  if (!treasury) {
    return { skipped: true, reason: 'SOLANA_TREASURY_ADDRESS not configured', scanned: 0, credited: 0, rejected: 0, cursor: null };
  }

  const cursor = await prisma.depositCursor.upsert({
    where: { chain: 'SOLANA' },
    create: { chain: 'SOLANA', treasury, lastSignature: null },
    update: {},
  });

  const sigInfos: SignatureInfo[] = await rpc('getSignaturesForAddress', [
    treasury,
    {
      ...(cursor.lastSignature ? { until: cursor.lastSignature } : {}),
      limit: Math.min(opts.limit ?? 100, 1000),
    },
  ]);

  // API returns newest first; process oldest -> newest so `until` stays sound.
  const ordered = [...sigInfos].reverse();
  let credited = 0;
  let rejected = 0;

  for (const info of ordered) {
    if (info.err) continue; // failed on-chain tx — nothing moved

    const tx: any = await rpc('getTransaction', [
      info.signature,
      { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 },
    ]);
    const parsed = parseDepositTx(tx, { treasury });
    if (!parsed) continue;

    const refCode = parsed.memo?.replace(/[^A-Z2-9]/g, '');
    if (!refCode) { rejected++; continue; }

    const agent = await prisma.web4Agent.findUnique({ where: { referenceCode: refCode } });
    if (!agent) { rejected++; continue; }

    const deposit = await prisma.deposit.create({
      data: {
        userId: agent.userId,
        agentId: agent.id,
        referenceCode: refCode,
        txSignature: info.signature,
        amountUsdc: parsed.amountUsdc,
        status: 'PENDING',
      },
    });

    const move = await postEntry({
      agentId: agent.id,
      userId: agent.userId,
      type: 'DEPOSIT',
      amountUsdc: parsed.amountUsdc,
      ref: info.signature,
      note: `On-chain deposit via memo ${refCode}`,
    });

    if (move.ok) {
      credited++;
      await prisma.deposit.update({ where: { id: deposit.id }, data: { status: 'CREDITED' } });
    } else {
      // Ledger already has this signature (replay); mark honestly, no credit.
      await prisma.deposit.update({ where: { id: deposit.id }, data: { status: 'REJECTED' } });
    }
  }

  const newest = sigInfos[0]?.signature ?? cursor.lastSignature ?? null;
  if (newest && newest !== cursor.lastSignature) {
    await prisma.depositCursor.update({ where: { id: cursor.id }, data: { lastSignature: newest } });
  }

  return { scanned: ordered.length, credited, rejected, cursor: newest };
}
