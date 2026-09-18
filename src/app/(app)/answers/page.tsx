import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import type { Answer, Item } from '@/lib/types';
import { StatusPill, Lv, fmtDate } from '@/components/ui';
export const dynamic = 'force-dynamic';

export default async function AnswersPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { item } = await searchParams;
  const sb = await supabaseServer();
  const [{ data: items }, { data: answers }] = await Promise.all([sb.from('items').select('id,title').order('created_at', { ascending: false }), sb.from('answers').select('*').order('created_at', { ascending: false })]);
  const its = (items || []) as Pick<Item, 'id' | 'title'>[];
  const list = ((answers || []) as Answer[]).filter(a => !item || a.item_id === item);
  return (
    <>
      <div className="view-head"><div><h1>답안·채점</h1><p className="lead">답안을 열어 ② 판독 확인 → ⑤ 채점·분석 → ⑥ 리포트 → ⑦ 학부모 링크를 진행합니다.</p></div>
        <div className="row"><form><select name="item" defaultValue={item || ''} style={{ width: 'auto' }}><option value="">모든 문항</option>{its.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}</select> <button className="btn sm">필터</button></form><Link className="btn primary" href="/upload">답안 업로드</Link></div></div>
      {list.length ? <div className="tbl"><table><thead><tr><th>학생</th><th>문항</th><th>상태</th><th>총점</th><th>수준</th><th>업로드</th></tr></thead><tbody>
        {list.map(a => <tr key={a.id}><td><Link href={`/answers/${a.id}`}><b>{a.student}</b></Link><div className="small muted">{a.grade}학년 {a.klass}반</div></td><td>{its.find(i => i.id === a.item_id)?.title || '(삭제된 문항)'}</td><td><StatusPill s={a.status} /></td><td className="num">{a.total != null ? <>{a.total}<span className="muted">/100</span></> : '—'}</td><td>{a.level ? <Lv l={a.level} /> : '—'}</td><td className="num">{fmtDate(a.created_at)}</td></tr>)}
      </tbody></table></div> : <div className="empty">답안이 없습니다.</div>}
    </>
  );
}
