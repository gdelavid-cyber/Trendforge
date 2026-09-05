import { timingSafeEqual } from 'crypto';

// Direction B — service identity for opencode sessions and other
// server-to-server callers. Trust boundary, stated plainly:
// - A valid service key may READ Nova state and PROPOSE actions.
// - It may never APPROVE, REJECT, or execute. Approvals stay human,
//   session-bound, in the widget/console inbox. No exceptions.

export function checkServiceKey(req: Request): boolean {
  const expected = process.env.NOVA_SERVICE_KEY;
  if (!expected) return false; // fail closed: no key configured, no access
  const provided = req.headers.get('x-nova-key');
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function serviceUserId(req: Request, url: URL): string | null {
  if (!checkServiceKey(req)) return null;
  const id = url.searchParams.get('userId');
  return id && id.length > 0 && id.length <= 100 ? id : null;
}
