import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import { generateConwayWallet } from '../lib/web4/wallet';
import { ledgerBalance } from '../lib/web4/ledger';
import {
  ensureReferenceCode,
  generateReferenceCode,
  parseDepositTx,
  verifyDeposits,
} from '../lib/web4/deposits';
import { settleBattle } from '../lib/battles/settle';

// T4: on-chain USDC deposits (memo-matched), the verifier cursor, and the
// battle ledger flow. RPC is stubbed with fixtures; ledger/deposit rows are
// real so idempotency guarantees are exercised against the database.

const RUN = `dep-${Date.now()}`;
const TREASURY = `Treasury${RUN}Addr`.slice(0, 40);
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

let userId: string;
let agentId: string;
let referenceCode: string;

function rpcResponse(result: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ jsonrpc: '2.0', id: 1, result }),
  };
}

/** jsonParsed tx fixture: treasury receives `amount` USDC, memo attached. */
function depositTx(signatureMemo: string | null, amount: number) {
  const treasuryIndex = 1;
  const instructions: any[] = [];
  if (signatureMemo) {
    // SPL Memo v2 parsed form
    instructions.push({
      programId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
      parsed: { type: 'memo', memo: signatureMemo },
    });
  }
  instructions.push({ programId: '11111111111111111111111111111111', parsed: { type: 'unknown' } });
  return {
    meta: {
      preTokenBalances: [
        { accountIndex: treasuryIndex, mint: USDC_MINT, owner: TREASURY, uiTokenAmount: { uiAmount: 100.0 } },
      ],
      postTokenBalances: [
        { accountIndex: treasuryIndex, mint: USDC_MINT, owner: TREASURY, uiTokenAmount: { uiAmount: 100.0 + amount } },
      ],
      innerInstructions: [],
    },
    transaction: { message: { instructions } },
  };
}

beforeAll(async () => {
  process.env.SOLANA_TREASURY_ADDRESS = TREASURY;

  const user = await prisma.user.create({
    data: { email: `${RUN}@deposit-test.local`, name: 'Deposit Test User', passwordHash: 'x' },
  });
  userId = user.id;
  referenceCode = generateReferenceCode();
  const agent = await prisma.web4Agent.create({
    data: {
      userId,
      name: 'Deposit Test Agent',
      archetype: 'GENERALIST',
      walletAddress: generateConwayWallet(`${RUN}-agent`).address,
      walletBalance: 0,
      skills: [],
      referenceCode,
    },
  });
  agentId = agent.id;
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await prisma.deposit.deleteMany({ where: { agentId } });
  await prisma.ledgerEntry.deleteMany({ where: { agentId } });
  await prisma.web4Agent.deleteMany({ where: { userId } });
  await prisma.depositCursor.deleteMany({ where: { treasury: TREASURY } });
  await prisma.user.deleteMany({ where: { id: userId } });
  delete process.env.SOLANA_TREASURY_ADDRESS;
  await prisma.$disconnect();
});

describe('reference codes', () => {
  it('generates 8-char codes from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferenceCode();
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    }
    expect(generateReferenceCode()).not.toBe(generateReferenceCode());
  });

  it('ensureReferenceCode assigns once and reuses it for legacy agents', async () => {
    const first = await ensureReferenceCode(agentId);
    expect(first).toBe(referenceCode);
  });
});

describe('parseDepositTx (memo + amount extraction)', () => {
  it('extracts SPL Memo v2 text and the treasury USDC delta', () => {
    const parsed = parseDepositTx(depositTx('ABCD2345', 25), { treasury: TREASURY })!;
    expect(parsed.memo).toBe('ABCD2345');
    expect(parsed.amountUsdc).toBeCloseTo(25);
  });

  it('reads raw Memo v1 data payloads as printable text', () => {
    const tx = depositTx(null, 10);
    tx.transaction.message.instructions.unshift({
      programId: 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo',
      data: 'ZZZZ9999',
    });
    const parsed = parseDepositTx(tx, { treasury: TREASURY })!;
    expect(parsed.memo).toBe('ZZZZ9999');
    expect(parsed.amountUsdc).toBeCloseTo(10);
  });

  it('returns null when neither a memo nor a USDC delta exists', () => {
    expect(parseDepositTx({ meta: { preTokenBalances: [], postTokenBalances: [] }, transaction: { message: { instructions: [] } } }, { treasury: TREASURY })).toBeNull();
  });
});

describe('verifyDeposits (RPC-stubbed end to end)', () => {
  const sigOldest = `sig-old-${RUN}`;
  const sigMatch = `sig-match-${RUN}`;
  const sigUnknown = `sig-unknown-${RUN}`;
  const sigFailed = `sig-failed-${RUN}`;

  function stubRpc() {
    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      const { method, params = [] }: { method: string; params: any[] } = JSON.parse(init.body);

      if (method === 'getSignaturesForAddress') {
        const untilSig = params[1]?.until;
        if (untilSig) return rpcResponse([]); // everything before cursor already seen
        return rpcResponse([
          { signature: sigFailed, err: { InstructionError: [0, 'Custom'] } },
          { signature: sigUnknown, err: null },
          { signature: sigMatch, err: null },
          { signature: sigOldest, err: null },
        ]);
      }

      if (method === 'getTransaction') {
        const sig = params[0];
        if (sig === sigMatch || sig === sigOldest) return rpcResponse(depositTx(referenceCode, 25));
        if (sig === sigUnknown) return rpcResponse(depositTx('NOPE1234', 99));
      }

      throw new Error(`unexpected rpc ${method}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('credits matched memos, rejects unknown refs, ignores failed txs, advances cursor', async () => {
    const fetchMock = stubRpc();

    const result = await verifyDeposits();

    expect(result.skipped).toBeFalsy();
    expect(result.credited).toBe(2); // oldest + match both carry our code
    expect(result.rejected).toBe(1); // unknown memo refused — never guessed
    expect(result.cursor).toBe(sigFailed); // newest processed signature

    // Ledger credited exactly what arrived on-chain.
    expect(await ledgerBalance(agentId)).toBeCloseTo(50);
    const entries = await prisma.ledgerEntry.findMany({
      where: { agentId, type: 'DEPOSIT' },
    });
    expect(entries.map((e) => e.ref).sort()).toEqual([sigMatch, sigOldest].sort());

    const deposits = await prisma.deposit.findMany({ where: { agentId } });
    expect(deposits.every((d) => d.status === 'CREDITED')).toBe(true);
  });

  it('replaying the same pass credits nothing twice and scans only past the cursor', async () => {
    const fetchMock = stubRpc(); // second run sees an empty newer-signature window

    const replay = await verifyDeposits();

    // Cursor from the previous pass scopes this scan…
    expect(fetchMock.mock.calls.some(([, init]: any[]) =>
      JSON.parse(init.body).params?.[1]?.until === sigFailed
    )).toBe(true);
    // …so nothing re-credits.
    expect(replay.credited).toBe(0);
    expect(await ledgerBalance(agentId)).toBeCloseTo(50);
  });
});

describe('battle ledger flow', () => {
  let challengerId: string;
  let defenderId: string;

  beforeAll(async () => {
    const challenger = await prisma.web4Agent.create({
      data: {
        userId,
        name: 'Battle Challenger',
        archetype: 'GENERALIST',
        walletAddress: generateConwayWallet(`${RUN}-c`).address,
        walletBalance: 0,
        skills: [],
      },
    });
    challengerId = challenger.id;
    const defender = await prisma.web4Agent.create({
      data: {
        userId,
        name: 'Battle Defender',
        archetype: 'GENERALIST',
        walletAddress: generateConwayWallet(`${RUN}-d`).address,
        walletBalance: 0,
        skills: [],
      },
    });
    defenderId = defender.id;

    // Fund both via honest deposits.
    await prisma.ledgerEntry.create({ data: { agentId: challengerId, userId, type: 'DEPOSIT', amountUsdc: 10, ref: `${RUN}-bfund` } });
    await prisma.web4Agent.update({ where: { id: challengerId }, data: { walletBalance: 10 } });
    await prisma.ledgerEntry.create({ data: { agentId: defenderId, userId, type: 'DEPOSIT', amountUsdc: 4, ref: `${RUN}-dfund` } });
    await prisma.web4Agent.update({ where: { id: defenderId }, data: { walletBalance: 4 } });
  });

  afterAll(async () => {
    await prisma.agentBattle.deleteMany({ where: { OR: [{ challengerId }, { defenderId }] } });
    await prisma.ledgerEntry.deleteMany({ where: { agentId: { in: [challengerId, defenderId] } } });
    await prisma.web4Agent.deleteMany({ where: { id: { in: [challengerId, defenderId] } } });
  });

  const tier = { name: 'Bronze Contender Arena', tier: 'BRONZE', entryFeeUsdc: 5 };

  it('debits the entry fee from the challenger and credits the winner pot', async () => {
    const settled = await settleBattle({
      challenger: { id: challengerId, userId, walletBalance: 10 },
      defender: { id: defenderId, userId, walletBalance: 4 },
      winnerId: defenderId, // challenger loses — entry moves to the pot holder
      tierConfig: tier as any,
    });

    expect(settled.ok).toBe(true);
    expect(settled.pot).toBe(5);
    expect(settled.balances!.challenger).toBeCloseTo(5);
    expect(settled.balances!.defender).toBeCloseTo(9);
  });

  it('a winning challenger nets zero — no money created', async () => {
    const settled = await settleBattle({
      challenger: { id: challengerId, userId, walletBalance: 5 },
      defender: { id: defenderId, userId, walletBalance: 9 },
      winnerId: challengerId,
      tierConfig: tier as any,
    });

    expect(settled.ok).toBe(true);
    expect(settled.balances!.challenger).toBeCloseTo(5); // -5 entry +5 pot
  });

  it('rejects entry when the challenger cannot cover the fee', async () => {
    const settled = await settleBattle({
      challenger: { id: challengerId, userId, walletBalance: 5 },
      defender: { id: defenderId, userId, walletBalance: 9 },
      winnerId: challengerId,
      tierConfig: { name: 'Gold Mastermind Arena', tier: 'GOLD', entryFeeUsdc: 50 } as any,
    });

    expect(settled.ok).toBe(false);
    expect(settled.code).toBe('INSUFFICIENT_FUNDS');
  });
});
