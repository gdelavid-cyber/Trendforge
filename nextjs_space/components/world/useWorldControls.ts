'use client';

import { useEffect, useRef } from 'react';
import type { MoveInput } from './movement';

const KEYMAP: Record<string, keyof MoveInput> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  Space: 'jump',
};

/**
 * Ref-based keyboard tracking. Reads happen inside useFrame without
 * triggering React re-renders.
 */
export function useWorldControls() {
  const input = useRef<MoveInput>({
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = KEYMAP[e.code];
      if (!k) return;
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      input.current[k] = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = KEYMAP[e.code];
      if (!k) return;
      input.current[k] = false;
    };
    const blur = () => {
      (Object.keys(input.current) as (keyof MoveInput)[]).forEach((k) => (input.current[k] = false));
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  return input;
}
