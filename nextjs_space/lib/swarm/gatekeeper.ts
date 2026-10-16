import { redis } from '@/lib/core/redis';

const KILL_SWITCH_KEY = 'trendly:swarm:kill_switch';

export async function isGlobalKillSwitchActive(): Promise<boolean> {
  try {
    const val = await redis.get(KILL_SWITCH_KEY);
    return val === '1' || val === 'true';
  } catch {
    return false;
  }
}

export async function setGlobalKillSwitch(active: boolean): Promise<void> {
  try {
    if (active) {
      await redis.set(KILL_SWITCH_KEY, '1');
    } else {
      await redis.del(KILL_SWITCH_KEY);
    }
  } catch (err) {
    console.warn('Failed to set swarm kill switch:', err);
  }
}
