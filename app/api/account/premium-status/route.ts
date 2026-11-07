import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { hasPremiumAccess } from '@/lib/premium';

export async function GET() {
  const supabase = await createClientServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  try {
    const premium = await hasPremiumAccess(user.id);
    return NextResponse.json({ premium }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    // Never misrepresent an unavailable entitlement check as a Free account.
    return NextResponse.json({ error: 'premium_status_unavailable' }, {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
