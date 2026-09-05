import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import {
  deleteIntegration,
  getIntegration,
  listIntegrations,
  saveIntegration,
} from '../lib/core/vault';

// Action-integration vault: credentials encrypt at rest, decrypt in-process,
// masked summaries never expose secrets, deletes are real.

const RUN = `vault-${Date.now()}`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@vault-test.local`, name: 'Vault Test User', passwordHash: 'x' },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.userIntegrationKey.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('integration vault', () => {
  it('stores sendgrid creds encrypted and returns them decrypted in-process', async () => {
    await saveIntegration({
      userId,
      provider: 'sendgrid',
      creds: { apiKey: 'SG.super-secret-key-123' },
      meta: { verifiedSender: 'bot@trendly.app' },
    });

    const row = await prisma.userIntegrationKey.findUniqueOrThrow({
      where: { userId_provider: { userId, provider: 'sendgrid' } },
    });
    expect(row.encryptedKey).not.toContain('SG.super-secret-key-123');
    expect(row.encryptedKey.split(':')).toHaveLength(3); // IV:tag:ciphertext

    const creds = await getIntegration(userId, 'sendgrid');
    expect(creds).toEqual({ apiKey: 'SG.super-secret-key-123' });
  });

  it('round-trips multi-field polymarket creds', async () => {
    const creds = { apiKey: 'pk-live', secret: 'cs-live', passphrase: 'pp-live' };
    await saveIntegration({ userId, provider: 'polymarket', creds });

    expect(await getIntegration(userId, 'polymarket')).toEqual(creds);
  });

  it('rejects incomplete creds with the missing field named', async () => {
    await expect(
      saveIntegration({ userId, provider: 'x', creds: {} })
    ).rejects.toThrow(/accessToken/);
    await expect(
      saveIntegration({ userId, provider: 'websearch', creds: { apiKey: 'k', vendor: 'google' } })
    ).rejects.toThrow(/vendor/);
  });

  it('masked summaries never contain raw secrets', async () => {
    const list = await listIntegrations(userId);
    expect(list.length).toBeGreaterThanOrEqual(2);
    for (const item of list) {
      expect(item.maskedKey).not.toContain('super-secret');
      expect(item.maskedKey).not.toContain('cs-live');
      expect(item.label).toBeTruthy();
    }
  });

  it('updating a provider replaces creds without duplicating the row', async () => {
    await saveIntegration({ userId, provider: 'resend', creds: { apiKey: 're_old' } });
    await saveIntegration({ userId, provider: 'resend', creds: { apiKey: 're_new_456' } });

    const rows = await prisma.userIntegrationKey.findMany({ where: { userId, provider: 'resend' } });
    expect(rows).toHaveLength(1);
    expect(await getIntegration(userId, 'resend')).toEqual({ apiKey: 're_new_456' });
  });

  it('delete removes the row and reads return null afterwards', async () => {
    expect(await deleteIntegration(userId, 'resend')).toBe(true);
    expect(await getIntegration(userId, 'resend')).toBeNull();
    expect(await deleteIntegration(userId, 'resend')).toBe(false);
  });
});
