import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/** 초대·비밀번호 재설정 메일의 링크가 도착하는 곳: 코드를 세션으로 바꾸고 비밀번호 설정 화면으로 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/set-password';
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login?reason=link_invalid', url.origin));
}
