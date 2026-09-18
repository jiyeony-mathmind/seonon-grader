import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import type { Teacher } from './types';

/** 로그인 + 선생님 명단 확인. 실패 시 로그인 페이지로. API 라우트에서는 throw 대신 null 을 돌려받도록 soft 옵션. */
export async function requireTeacher(opts: { soft?: boolean } = {}): Promise<{ userId: string; email: string; teacher: Teacher | null }> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { if (opts.soft) throw new Response('로그인이 필요합니다', { status: 401 }); redirect('/login'); }
  const { data: teacher } = await sb.from('teachers').select('*').eq('user_id', user.id).maybeSingle();
  if (!teacher) { if (opts.soft) throw new Response('선생님 명단에 없는 계정입니다', { status: 403 }); redirect('/login?reason=not_teacher'); }
  return { userId: user.id, email: user.email || '', teacher: teacher as Teacher };
}
