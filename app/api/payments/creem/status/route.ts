import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('attemptId')?.trim() || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({error:'invalid_attempt'},{status:400});
  }
  const supabase = await createClientServer();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error:'unauthorized'},{status:401});
  const {data,error} = await supabase.from('creem_checkout_sessions')
    .select('id,mode,status,expected_amount_cents,currency,current_period_end,updated_at')
    .eq('id',id).eq('user_id',user.id).maybeSingle();
  if (error) return NextResponse.json({error:'status_unavailable'},{status:503});
  if (!data) return NextResponse.json({error:'attempt_not_found'},{status:404});
  return NextResponse.json({
    attemptId:data.id,mode:data.mode,status:data.status,
    amountCents:data.expected_amount_cents,currency:data.currency,
    periodEnd:data.current_period_end,updatedAt:data.updated_at,
    premiumGrantedByTest:false,
  },{headers:{'Cache-Control':'private, no-store'}});
}
