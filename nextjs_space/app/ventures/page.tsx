export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

// Venture OS hidden until further notice
export default async function VenturesPage() {
  redirect('/dashboard');
}
