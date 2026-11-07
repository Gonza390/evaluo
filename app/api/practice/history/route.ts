import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { getPracticeHistory } from '@/lib/student-materials/practice-history';

export async function GET() {
  const supabase = await createClientServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, {
    status: 401, headers: { 'Cache-Control': 'private, no-store' },
  });

  const { data: materials, error } = await supabase.from('student_materials')
    .select('id')
    .eq('user_id', user.id)
    .eq('processing_status', 'ready')
    .order('created_at', { ascending: false })
    .limit(24);
  if (error) return NextResponse.json({ error: 'history_unavailable' }, {
    status: 503, headers: { 'Cache-Control': 'private, no-store' },
  });
  try {
    const history = await getPracticeHistory(user.id, (materials ?? []).map(item => item.id));
    return NextResponse.json({ history }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'history_unavailable' }, {
      status: 503, headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
