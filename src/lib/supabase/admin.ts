import { createClient } from '@supabase/supabase-js';

/** service_role 키로 동작하는 서버 전용 클라이언트 (RLS 우회). 학부모 리포트 페이지·AI 파이프라인에서만 사용. */
export function supabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
