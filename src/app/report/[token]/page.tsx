import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Answer, Item } from '@/lib/types';
import { ParentReportView } from '@/components/ReportViews';
export const dynamic = 'force-dynamic';

/** 학부모용 공개 페이지: 로그인 없이 토큰으로만 접근. 토큰이 틀리거나 만료되면 안내만 표시. */
export default async function ParentReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = supabaseAdmin();
  const { data } = await admin.from('answers').select('*').eq('parent_token', token).maybeSingle();
  const a = data as Answer | null;
  const expired = a?.parent_token_expires_at && new Date(a.parent_token_expires_at) < new Date();
  if (!a || !a.reports || expired) return <div className="public"><div className="card"><h2>리포트를 찾을 수 없습니다</h2><p className="muted" style={{ marginTop: 6 }}>링크가 잘못되었거나 만료되었습니다. 학원에 문의해 주세요.</p></div></div>;
  const { data: item } = await admin.from('items').select('*').eq('id', a.item_id).maybeSingle();
  return <div className="public"><ParentReportView a={a} it={(item || null) as Item | null} p={a.reports.parent} /><p className="small muted" style={{ marginTop: 12, textAlign: 'center' }}>이 리포트는 승인된 루브릭에 따라 채점한 결과를 바탕으로 작성되었습니다.</p></div>;
}
