// Feature flags read at module scope. NEXT_PUBLIC_ flags are inlined at
// build time by Next.js — flip them in env, redeploy, no code changes.
export const CONTEST_MODE =
  process.env.NEXT_PUBLIC_CONTEST_MODE === 'true';
