import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClientServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, {
    status: 401, headers: { 'Cache-Control': 'private, no-store' },
  });
  const { data, error } = await supabase.from('student_materials')
    .select('id,title')
    .eq('user_id', user.id)
    .eq('processing_status', 'ready')
    .order('created_at', { ascending: false })
    .limit(24);
  if (error) return NextResponse.json({ error: 'catalog_unavailable' }, {
    status: 503, headers: { 'Cache-Control': 'private, no-store' },
  });
  return NextResponse.json({ materials: data ?? [] }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
