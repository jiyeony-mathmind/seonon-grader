import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** 로그인한 사용자의 권한으로 동작하는 서버 클라이언트 (RLS 적용) */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list) { try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* 서버 컴포넌트에서는 무시 */ } },
    },
  });
}
