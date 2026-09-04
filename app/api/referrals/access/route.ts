import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { getReferralPortalData } from '@/lib/referral-portal';

export async function GET() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasAccess: false }, { status: 401 });
  }

  try {
    const portal = await getReferralPortalData(user);
    return NextResponse.json(
      { hasAccess: Boolean(portal) },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json({ hasAccess: false }, { status: 503 });
  }
}
