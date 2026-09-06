import { afterEach, describe, expect, it } from 'vitest';
import { assertSaleAccess } from '../lib/money/escrow';
import { checkCronAuth } from '../lib/core/route-auth';
import { validatePipelineKey } from '../lib/pipeline';

// Phase 1 — lock the doors: ownership gates, secret handling.

const OLD_CRON = process.env.CRON_SECRET;
const OLD_PIPE = process.env.PIPELINE_API_KEY;

afterEach(() => {
  if (OLD_CRON === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = OLD_CRON;
  if (OLD_PIPE === undefined) delete process.env.PIPELINE_API_KEY;
  else process.env.PIPELINE_API_KEY = OLD_PIPE;
});

function req(headers: Record<string, string> = {}, url = 'http://x/api/cron/x'): Request {
  return new Request(url, { headers });
}

describe('assertSaleAccess', () => {
  const sale = { userId: 'seller-1' };

  it('lets the seller through', () => {
    expect(() => assertSaleAccess(sale, { userId: 'seller-1', isAdmin: false })).not.toThrow();
  });

  it('lets admins through', () => {
    expect(() => assertSaleAccess(sale, { userId: 'anyone', isAdmin: true })).not.toThrow();
  });

  it('blocks strangers with a 403', () => {
    try {
      assertSaleAccess(sale, { userId: 'stranger', isAdmin: false });
      expect.unreachable('should have thrown');
    } catch (e: any) {
      expect(e.message).toBe('Not your sale.');
      expect(e.status).toBe(403);
    }
  });
});

describe('checkCronAuth', () => {
  it('fails closed with no secret configured', () => {
    delete process.env.CRON_SECRET;
    delete process.env.PIPELINE_API_KEY;
    expect(checkCronAuth(req()).authorized).toBe(false);
    expect(checkCronAuth(req()).status).toBe(500);
  });

  it('accepts Bearer and x-api-key, rejects query keys and wrong keys', () => {
    process.env.CRON_SECRET = 'cron-secret-1';
    expect(checkCronAuth(req({ authorization: 'Bearer cron-secret-1' })).authorized).toBe(true);
    expect(checkCronAuth(req({ 'x-api-key': 'cron-secret-1' })).authorized).toBe(true);
    expect(checkCronAuth(req()).authorized).toBe(false);
    expect(checkCronAuth(req({ 'x-api-key': 'wrong' })).authorized).toBe(false);
    expect(checkCronAuth(req({}, 'http://x/api/cron/x?key=cron-secret-1')).authorized).toBe(false);
    expect(checkCronAuth(req({}, 'http://x/api/cron/x?api_key=cron-secret-1')).authorized).toBe(false);
  });

  it('falls back to PIPELINE_API_KEY only when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET;
    process.env.PIPELINE_API_KEY = 'pipe-key-1';
    expect(checkCronAuth(req({ 'x-api-key': 'pipe-key-1' })).authorized).toBe(true);
    expect(checkCronAuth(req({ 'x-api-key': 'cron-secret-1' })).authorized).toBe(false);
  });
});

describe('validatePipelineKey', () => {
  it('accepts header keys, rejects query keys and wrong keys', () => {
    process.env.PIPELINE_API_KEY = 'pipe-key-1';
    expect(validatePipelineKey(req({ 'x-api-key': 'pipe-key-1' }))).toBe(true);
    expect(validatePipelineKey(req({ authorization: 'Bearer pipe-key-1' }))).toBe(true);
    expect(validatePipelineKey(req())).toBe(false);
    expect(validatePipelineKey(req({ 'x-api-key': 'wrong' }))).toBe(false);
    expect(validatePipelineKey(req({}, 'http://x/api/pipeline/run?key=pipe-key-1'))).toBe(false);
  });

  it('fails closed with no key configured', () => {
    delete process.env.PIPELINE_API_KEY;
    expect(validatePipelineKey(req({ 'x-api-key': 'anything' }))).toBe(false);
  });
});
