import { Metadata } from 'next';
import { LocalBusinessCinematicFlow } from './_components/local-business-cinematic-flow';

export const metadata: Metadata = {
  title: 'Local Business Video Packages | Video Empire Play 01 — Trendly',
  description: 'Sell 20 branded short-form vertical videos per month to local businesses with turnkey AI Remotion renders.',
};

export default function LocalBusinessPlayPage() {
  return <LocalBusinessCinematicFlow />;
}
